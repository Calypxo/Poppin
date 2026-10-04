const express = require("express");

const Event = require("../models/Event");
const Organizer = require("../models/Organizer");
const Venue = require("../models/Venue");
const Category = require("../models/Category");

const router = express.Router();

// ------------------------------------------------------
// HELPER: ESCAPE SEARCH TEXT
// ------------------------------------------------------
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ------------------------------------------------------
// HELPER: PROCESS PUBLIC EVENT STATE
// ------------------------------------------------------
function processPublicEvent(event) {
  const eventObject = event.toObject();

  const now = new Date();

  const startDate = new Date(
    event.startDate
  );

  const endDate = new Date(
    event.endDate
  );

  let eventState = "upcoming";

  if (
    now >= startDate &&
    now <= endDate
  ) {
    eventState = "ongoing";
  } else if (
    now > endDate
  ) {
    eventState = "completed";
  }

  const millisecondsPerDay =
    1000 * 60 * 60 * 24;

  const daysUntilStart =
    Math.ceil(
      (startDate - now) /
        millisecondsPerDay
    );

  return {
    ...eventObject,

    eventState,

    daysUntilStart:
      eventState === "upcoming"
        ? Math.max(
            daysUntilStart,
            0
          )
        : 0,
  };
}

// ------------------------------------------------------
// DISCOVER EVENTS
// GET /api/events/discover
// ------------------------------------------------------
router.get(
  "/discover",
  async (req, res, next) => {
    try {
      const {
        search,
        city,
        category,
        featured,
      } = req.query;

      // Only published events
      // are visible publicly.
      const filter = {
        status: "published",
      };

      // ------------------------------------------------
      // SEARCH TITLE / DESCRIPTION
      // ------------------------------------------------
      if (search) {
        const safeSearch =
          escapeRegex(
            String(search)
          );

        filter.$or = [
          {
            title: {
              $regex:
                safeSearch,
              $options: "i",
            },
          },

          {
            description: {
              $regex:
                safeSearch,
              $options: "i",
            },
          },
        ];
      }

      // ------------------------------------------------
      // FILTER BY VENUE CITY
      // ------------------------------------------------
      if (city) {
        const safeCity =
          escapeRegex(
            String(city)
          );

        const venues =
          await Venue.find({
            city: {
              $regex:
                safeCity,
              $options: "i",
            },
          }).select("_id");

        filter.venue = {
          $in: venues.map(
            (venue) =>
              venue._id
          ),
        };
      }

      // ------------------------------------------------
      // FILTER BY CATEGORY
      // ------------------------------------------------
      if (category) {
        const safeCategory =
          escapeRegex(
            String(category)
          );

        const categories =
          await Category.find({
            name: {
              $regex:
                safeCategory,
              $options: "i",
            },
          }).select("_id");

        filter.categories = {
          $in: categories.map(
            (item) =>
              item._id
          ),
        };
      }

      // ------------------------------------------------
      // FEATURED ONLY
      // ------------------------------------------------
      if (
        featured === "true"
      ) {
        filter.isFeatured =
          true;
      }

      const events =
        await Event.find(
          filter
        )
          .populate(
            "organizer",
            "name city status"
          )
          .populate(
            "venue",
            "name address city province venueType"
          )
          .populate(
            "categories",
            "name"
          )
          .sort({
            startDate: 1,
          });

      const processedEvents =
        events.map(
          processPublicEvent
        );

      res.status(200).json({
        count:
          processedEvents.length,

        filters: {
          search:
            search || null,

          city:
            city || null,

          category:
            category || null,

          featured:
            featured === "true",
        },

        events:
          processedEvents,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------
// GET ONE PUBLIC EVENT
// GET /api/events/public/:id
//
// IMPORTANT:
// Only published events can be retrieved here.
// ------------------------------------------------------
router.get(
  "/public/:id",
  async (req, res, next) => {
    try {
      const event =
        await Event.findOne({
          _id:
            req.params.id,

          status:
            "published",
        })
          .populate(
            "organizer",
            "name city status"
          )
          .populate(
            "venue",
            "name address city province venueType"
          )
          .populate(
            "categories",
            "name"
          );

      if (!event) {
        return res
          .status(404)
          .json({
            message:
              "Published event not found",
          });
      }

      const processedEvent =
        processPublicEvent(
          event
        );

      res.status(200).json(
        processedEvent
      );
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------
// GET ALL EVENTS
//
// Used by Organizer/Admin.
// Includes every workflow status.
// ------------------------------------------------------
router.get(
  "/",
  async (req, res, next) => {
    try {
      const events =
        await Event.find()
          .populate(
            "organizer"
          )
          .populate(
            "venue"
          )
          .populate(
            "categories"
          )
          .sort({
            startDate: 1,
          });

      res.status(200).json(
        events
      );
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------
// EVENT STATUS WORKFLOW
// PATCH /api/events/:id/status
// ------------------------------------------------------
router.patch(
  "/:id/status",
  async (req, res, next) => {
    try {
      const {
        status,
        rejectionReason,
      } = req.body;

      const allowedStatuses = [
        "pending",
        "published",
        "rejected",
        "cancelled",
      ];

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "Status must be pending, published, rejected, or cancelled",
          });
      }

      const event =
        await Event.findById(
          req.params.id
        ).populate(
          "organizer"
        );

      if (!event) {
        return res
          .status(404)
          .json({
            message:
              "Event not found",
          });
      }

      const currentStatus =
        event.status;

      // ------------------------------------------------
      // DEFINE ALLOWED STATUS CHANGES
      // ------------------------------------------------
      const allowedTransitions = {
        draft: [
          "pending",
        ],

        pending: [
          "published",
          "rejected",
        ],

        rejected: [
          "pending",
        ],

        published: [
          "cancelled",
        ],

        cancelled: [],
      };

      const possibleNextStatuses =
        allowedTransitions[
          currentStatus
        ] || [];

      if (
        !possibleNextStatuses.includes(
          status
        )
      ) {
        return res
          .status(400)
          .json({
            message: `Event cannot change from ${currentStatus} to ${status}`,
          });
      }

      // ------------------------------------------------
      // SUBMIT / RESUBMIT FOR REVIEW
      // ------------------------------------------------
      if (
        status === "pending"
      ) {
        if (
          !event.title ||
          !event.description
        ) {
          return res
            .status(400)
            .json({
              message:
                "Event title and description are required before submission",
            });
        }

        if (
          !event.organizer
        ) {
          return res
            .status(400)
            .json({
              message:
                "Event must have an organizer before submission",
            });
        }

        if (
          !event.venue
        ) {
          return res
            .status(400)
            .json({
              message:
                "Event must have a venue before submission",
            });
        }

        if (
          !event.categories ||
          event.categories
            .length === 0
        ) {
          return res
            .status(400)
            .json({
              message:
                "Event must have at least one category before submission",
            });
        }

        const startDate =
          new Date(
            event.startDate
          );

        const endDate =
          new Date(
            event.endDate
          );

        if (
          endDate <
          startDate
        ) {
          return res
            .status(400)
            .json({
              message:
                "Event end date cannot be earlier than the start date",
            });
        }

        // Clear old rejection
        // reason when resubmitting.
        event.rejectionReason =
          "";
      }

      // ------------------------------------------------
      // ADMIN PUBLISHES EVENT
      // ------------------------------------------------
      if (
        status ===
        "published"
      ) {
        if (
          !event.organizer ||
          event.organizer
            .status !==
            "verified"
        ) {
          return res
            .status(400)
            .json({
              message:
                "Only events from verified organizers can be published",
            });
        }

        const startDate =
          new Date(
            event.startDate
          );

        const endDate =
          new Date(
            event.endDate
          );

        if (
          endDate <
          startDate
        ) {
          return res
            .status(400)
            .json({
              message:
                "Event end date cannot be earlier than the start date",
            });
        }

        event.rejectionReason =
          "";
      }

      // ------------------------------------------------
      // ADMIN REJECTS EVENT
      // ------------------------------------------------
      if (
        status ===
        "rejected"
      ) {
        if (
          !rejectionReason ||
          !rejectionReason.trim()
        ) {
          return res
            .status(400)
            .json({
              message:
                "Rejection reason is required",
            });
        }

        event.rejectionReason =
          rejectionReason.trim();
      }

      // ------------------------------------------------
      // CANCEL EVENT
      // ------------------------------------------------
      if (
        status ===
        "cancelled"
      ) {
        event.rejectionReason =
          "";
      }

      event.status =
        status;

      await event.save();

      const updatedEvent =
        await Event.findById(
          event._id
        )
          .populate(
            "organizer"
          )
          .populate(
            "venue"
          )
          .populate(
            "categories"
          );

      res.status(200).json({
        message: `Event status updated to ${status}`,

        event:
          updatedEvent,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------
// GET ONE EVENT
//
// Organizer/Admin version.
// Can retrieve draft, pending, published,
// rejected, or cancelled events.
// ------------------------------------------------------
router.get(
  "/:id",
  async (req, res, next) => {
    try {
      const event =
        await Event.findById(
          req.params.id
        )
          .populate(
            "organizer"
          )
          .populate(
            "venue"
          )
          .populate(
            "categories"
          );

      if (!event) {
        return res
          .status(404)
          .json({
            message:
              "Event not found",
          });
      }

      res.status(200).json(
        event
      );
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------
// CREATE EVENT
// New events always begin as draft.
// ------------------------------------------------------
router.post(
  "/",
  async (req, res, next) => {
    try {
      const eventData = {
        ...req.body,

        // Client cannot directly
        // create published/pending/etc.
        status:
          "draft",

        rejectionReason:
          "",
      };

      const event =
        await Event.create(
          eventData
        );

      const populatedEvent =
        await Event.findById(
          event._id
        )
          .populate(
            "organizer"
          )
          .populate(
            "venue"
          )
          .populate(
            "categories"
          );

      res.status(201).json(
        populatedEvent
      );
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------
// UPDATE EVENT DETAILS
// ------------------------------------------------------
router.patch(
  "/:id",
  async (req, res, next) => {
    try {
      const event =
        await Event.findById(
          req.params.id
        );

      if (!event) {
        return res
          .status(404)
          .json({
            message:
              "Event not found",
          });
      }

      // Cancelled events
      // are final.
      if (
        event.status ===
        "cancelled"
      ) {
        return res
          .status(400)
          .json({
            message:
              "Cancelled events cannot be edited",
          });
      }

      const updates = {
        ...req.body,
      };

      // ------------------------------------------------
      // PROTECT WORKFLOW FIELDS
      // ------------------------------------------------

      // Status can only be changed
      // through /:id/status.
      delete updates.status;

      // Admin review controls this.
      delete updates.rejectionReason;

      // Prevent moving an Event
      // to another Organizer.
      delete updates.organizer;

      Object.assign(
        event,
        updates
      );

      // ------------------------------------------------
      // VALIDATE EVENT DATES
      // ------------------------------------------------
      if (
        event.startDate &&
        event.endDate
      ) {
        const startDate =
          new Date(
            event.startDate
          );

        const endDate =
          new Date(
            event.endDate
          );

        if (
          endDate <
          startDate
        ) {
          return res
            .status(400)
            .json({
              message:
                "Event end date cannot be earlier than the start date",
            });
        }
      }

      // ------------------------------------------------
      // PUBLISHED EVENT WAS EDITED
      // ------------------------------------------------
      // Changes must be reviewed
      // by Admin again.
      if (
        event.status ===
        "published"
      ) {
        event.status =
          "pending";

        event.rejectionReason =
          "";
      }

      await event.save();

      await event.populate([
        {
          path:
            "organizer",
        },

        {
          path:
            "venue",
        },

        {
          path:
            "categories",
        },
      ]);

      // Keep the response format
      // expected by the frontend.
      res.status(200).json(
        event
      );
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------
// DELETE EVENT
// ------------------------------------------------------
router.delete(
  "/:id",
  async (req, res, next) => {
    try {
      const event =
        await Event.findByIdAndDelete(
          req.params.id
        );

      if (!event) {
        return res
          .status(404)
          .json({
            message:
              "Event not found",
          });
      }

      res.status(200).json({
        message:
          "Event deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;