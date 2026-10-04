const express = require("express");

const VendorCall = require("../models/VendorCall");
const VendorApplication = require("../models/VendorApplication");
const Event = require("../models/Event");

// Register referenced models
require("../models/Category");

const router = express.Router();

// ------------------------------------------------------
// HELPER: CHECK IF EVENT CAN HAVE AN OPEN VENDOR CALL
// ------------------------------------------------------
async function validatePublishedEvent(eventId) {
  const event = await Event.findById(eventId);

  if (!event) {
    return {
      valid: false,
      status: 404,
      message: "Event not found",
    };
  }

  if (event.status !== "published") {
    return {
      valid: false,
      status: 400,
      message:
        "Vendor applications can only be opened for published events",
    };
  }

  return {
    valid: true,
    event,
  };
}

// ------------------------------------------------------
// GET ALL VENDOR CALLS
// ------------------------------------------------------
router.get("/", async (req, res, next) => {
  try {
    const vendorCalls =
      await VendorCall.find()
        .populate(
          "event",
          "title startDate endDate status organizer"
        )
        .populate(
          "acceptedCategories",
          "name"
        )
        .sort({
          createdAt: -1,
        });

    res.status(200).json(
      vendorCalls
    );
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------
// GET ACTIVE PUBLIC VENDOR CALL FOR EVENT
// IMPORTANT: Keep before /:id
// ------------------------------------------------------
router.get(
  "/event/:eventId",
  async (req, res, next) => {
    try {
      // Public vendor calls should only
      // exist for published events.
      const event =
        await Event.findOne({
          _id: req.params.eventId,
          status: "published",
        });

      if (!event) {
        return res.status(404).json({
          message:
            "Published event not found",
        });
      }

      const vendorCall =
        await VendorCall.findOne({
          event: event._id,
          status: "open",
          isActive: true,
        })
          .populate(
            "event",
            "title startDate endDate status organizer"
          )
          .populate(
            "acceptedCategories",
            "name"
          )
          .sort({
            createdAt: -1,
          });

      if (!vendorCall) {
        return res.status(404).json({
          message:
            "No open vendor call found for this event",
        });
      }

      res.status(200).json(
        vendorCall
      );
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------
// GET VENDOR CALL AVAILABILITY
// ------------------------------------------------------
router.get(
  "/:id/availability",
  async (req, res, next) => {
    try {
      const vendorCall =
        await VendorCall.findById(
          req.params.id
        ).populate(
          "event",
          "title startDate endDate status"
        );

      if (!vendorCall) {
        return res.status(404).json({
          message:
            "Vendor call not found",
        });
      }

      const [
        totalApplications,
        approvedApplications,
        pendingApplications,
        rejectedApplications,
      ] = await Promise.all([
        VendorApplication.countDocuments({
          vendorCall:
            vendorCall._id,
        }),

        VendorApplication.countDocuments({
          vendorCall:
            vendorCall._id,
          status: "approved",
        }),

        VendorApplication.countDocuments({
          vendorCall:
            vendorCall._id,
          status: "pending",
        }),

        VendorApplication.countDocuments({
          vendorCall:
            vendorCall._id,
          status: "rejected",
        }),
      ]);

      const slotsRemaining =
        Math.max(
          vendorCall.totalSlots -
            approvedApplications,
          0
        );

      const now = new Date();

      const applicationStart =
        new Date(
          vendorCall.applicationStartDate
        );

      const applicationDeadline =
        new Date(
          vendorCall.applicationDeadline
        );

      let availabilityStatus =
        "closed";

      let canApply = false;

      // ----------------------------------------------
      // EVENT IS NO LONGER PUBLISHED
      // ----------------------------------------------
      if (
        !vendorCall.event ||
        vendorCall.event.status !==
          "published"
      ) {
        availabilityStatus =
          "closed";
      }

      // ----------------------------------------------
      // DRAFT VENDOR CALL
      // ----------------------------------------------
      else if (
        vendorCall.status ===
        "draft"
      ) {
        availabilityStatus =
          "draft";
      }

      // ----------------------------------------------
      // CLOSED / INACTIVE
      // ----------------------------------------------
      else if (
        vendorCall.status ===
          "closed" ||
        !vendorCall.isActive
      ) {
        availabilityStatus =
          "closed";
      }

      // ----------------------------------------------
      // NOT OPEN YET
      // ----------------------------------------------
      else if (
        now <
        applicationStart
      ) {
        availabilityStatus =
          "upcoming";
      }

      // ----------------------------------------------
      // DEADLINE PASSED
      // ----------------------------------------------
      else if (
        now >
        applicationDeadline
      ) {
        availabilityStatus =
          "closed";
      }

      // ----------------------------------------------
      // NO SLOTS LEFT
      // ----------------------------------------------
      else if (
        slotsRemaining <= 0
      ) {
        availabilityStatus =
          "full";
      }

      // ----------------------------------------------
      // AVAILABLE
      // ----------------------------------------------
      else {
        availabilityStatus =
          "open";

        canApply = true;
      }

      res.status(200).json({
        statistics: {
          totalApplications,
          approvedApplications,
          pendingApplications,
          rejectedApplications,
          slotsRemaining,
        },

        availability: {
          status:
            availabilityStatus,

          canApply,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------
// GET ONE VENDOR CALL
// ------------------------------------------------------
router.get(
  "/:id",
  async (req, res, next) => {
    try {
      const vendorCall =
        await VendorCall.findById(
          req.params.id
        )
          .populate(
            "event",
            "title startDate endDate status organizer"
          )
          .populate(
            "acceptedCategories",
            "name"
          );

      if (!vendorCall) {
        return res.status(404).json({
          message:
            "Vendor call not found",
        });
      }

      res.status(200).json(
        vendorCall
      );
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------
// CREATE VENDOR CALL
// ------------------------------------------------------
router.post(
  "/",
  async (req, res, next) => {
    try {
      const data = {
        ...req.body,
      };

      if (!data.event) {
        return res.status(400).json({
          message:
            "Event is required",
        });
      }

      const event =
        await Event.findById(
          data.event
        );

      if (!event) {
        return res.status(404).json({
          message:
            "Event not found",
        });
      }

      // ----------------------------------------------
      // VALIDATE DATES
      // ----------------------------------------------
      if (
        data.applicationStartDate &&
        data.applicationDeadline &&
        new Date(
          data.applicationDeadline
        ) <
          new Date(
            data.applicationStartDate
          )
      ) {
        return res.status(400).json({
          message:
            "Application deadline cannot be earlier than the opening date",
        });
      }

      // ----------------------------------------------
      // OPEN CALL REQUIRES PUBLISHED EVENT
      // ----------------------------------------------
      if (
        data.status === "open"
      ) {
        const validation =
          await validatePublishedEvent(
            data.event
          );

        if (!validation.valid) {
          return res
            .status(validation.status)
            .json({
              message:
                validation.message,
            });
        }
      }

      // Only accepted statuses
      if (
        data.status &&
        ![
          "draft",
          "open",
          "closed",
        ].includes(data.status)
      ) {
        return res.status(400).json({
          message:
            "Vendor call status must be draft, open, or closed",
        });
      }

      const vendorCall =
        await VendorCall.create({
          ...data,

          // Default to draft if
          // no status was supplied
          status:
            data.status ||
            "draft",
        });

      const populated =
        await VendorCall.findById(
          vendorCall._id
        )
          .populate(
            "event",
            "title startDate endDate status organizer"
          )
          .populate(
            "acceptedCategories",
            "name"
          );

      res.status(201).json(
        populated
      );
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------
// UPDATE VENDOR CALL
// ------------------------------------------------------
router.patch(
  "/:id",
  async (req, res, next) => {
    try {
      const vendorCall =
        await VendorCall.findById(
          req.params.id
        );

      if (!vendorCall) {
        return res.status(404).json({
          message:
            "Vendor call not found",
        });
      }

      const updates = {
        ...req.body,
      };

      // ----------------------------------------------
      // STATUS VALIDATION
      // ----------------------------------------------
      if (
        updates.status &&
        ![
          "draft",
          "open",
          "closed",
        ].includes(
          updates.status
        )
      ) {
        return res.status(400).json({
          message:
            "Vendor call status must be draft, open, or closed",
        });
      }

      // Determine what the Vendor Call
      // would look like after the update.
      const resultingEventId =
        updates.event ||
        vendorCall.event;

      const resultingStatus =
        updates.status ||
        vendorCall.status;

      // ----------------------------------------------
      // EVENT MUST EXIST
      // ----------------------------------------------
      const event =
        await Event.findById(
          resultingEventId
        );

      if (!event) {
        return res.status(404).json({
          message:
            "Event not found",
        });
      }

      // ----------------------------------------------
      // OPEN CALL REQUIRES PUBLISHED EVENT
      // ----------------------------------------------
      if (
        resultingStatus ===
        "open"
      ) {
        const validation =
          await validatePublishedEvent(
            resultingEventId
          );

        if (!validation.valid) {
          return res
            .status(validation.status)
            .json({
              message:
                validation.message,
            });
        }
      }

      // Apply updates before checking
      // the final dates.
      Object.assign(
        vendorCall,
        updates
      );

      // ----------------------------------------------
      // DATE VALIDATION
      // ----------------------------------------------
      if (
        vendorCall.applicationStartDate &&
        vendorCall.applicationDeadline &&
        new Date(
          vendorCall.applicationDeadline
        ) <
          new Date(
            vendorCall.applicationStartDate
          )
      ) {
        return res.status(400).json({
          message:
            "Application deadline cannot be earlier than the opening date",
        });
      }

      await vendorCall.save();

      await vendorCall.populate([
        {
          path: "event",
          select:
            "title startDate endDate status organizer",
        },
        {
          path: "acceptedCategories",
          select: "name",
        },
      ]);

      res.status(200).json(
        vendorCall
      );
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------
// DELETE VENDOR CALL
// ------------------------------------------------------
router.delete(
  "/:id",
  async (req, res, next) => {
    try {
      const vendorCall =
        await VendorCall.findById(
          req.params.id
        );

      if (!vendorCall) {
        return res.status(404).json({
          message:
            "Vendor call not found",
        });
      }

      // Prevent deleting a Vendor Call
      // that already has applications.
      const applicationCount =
        await VendorApplication.countDocuments(
          {
            vendorCall:
              vendorCall._id,
          }
        );

      if (
        applicationCount > 0
      ) {
        return res.status(400).json({
          message:
            "Vendor call cannot be deleted because applications already exist",
        });
      }

      await vendorCall.deleteOne();

      res.status(200).json({
        message:
          "Vendor call deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;