const express = require("express");

const VendorApplication = require(
  "../models/VendorApplication"
);

const VendorCall = require(
  "../models/VendorCall"
);

const Category = require(
  "../models/Category"
);

// Register referenced model
require("../models/Event");

const router = express.Router();

// ------------------------------------------------------
// HELPER: POPULATE APPLICATION
// ------------------------------------------------------
async function getPopulatedApplication(
  applicationId
) {
  return VendorApplication.findById(
    applicationId
  )
    .populate(
      "category",
      "name"
    )
    .populate({
      path: "vendorCall",
      select:
        "title event applicationStartDate applicationDeadline totalSlots boothFee boothSize status isActive",
      populate: {
        path: "event",
        select:
          "title startDate endDate startTime endTime status",
      },
    });
}

// ------------------------------------------------------
// HELPER: GET VENDOR CALL + EVENT
// ------------------------------------------------------
async function getVendorCallWithEvent(
  vendorCallId
) {
  return VendorCall.findById(
    vendorCallId
  ).populate(
    "event",
    "title startDate endDate startTime endTime status"
  );
}

// ------------------------------------------------------
// HELPER: CHECK APPLICATION WINDOW
// ------------------------------------------------------
function checkApplicationWindow(
  vendorCall
) {
  const now = new Date();

  const startDate = new Date(
    vendorCall.applicationStartDate
  );

  const deadline = new Date(
    vendorCall.applicationDeadline
  );

  if (now < startDate) {
    return {
      valid: false,
      message:
        "Vendor applications have not opened yet",
    };
  }

  if (now > deadline) {
    return {
      valid: false,
      message:
        "Vendor application deadline has passed",
    };
  }

  return {
    valid: true,
  };
}

// ------------------------------------------------------
// HELPER: CHECK VENDOR CALL CAN ACCEPT APPLICATIONS
// ------------------------------------------------------
async function validateVendorCallForApplication(
  vendorCall
) {
  if (!vendorCall) {
    return {
      valid: false,
      status: 404,
      message:
        "Vendor call not found",
    };
  }

  // ----------------------------------------------
  // PARENT EVENT MUST STILL BE PUBLISHED
  // ----------------------------------------------
  if (
    !vendorCall.event ||
    vendorCall.event.status !==
      "published"
  ) {
    return {
      valid: false,
      status: 400,
      message:
        "Vendor applications are unavailable because the event is not currently published",
    };
  }

  // ----------------------------------------------
  // VENDOR CALL MUST BE ACTIVE
  // ----------------------------------------------
  if (!vendorCall.isActive) {
    return {
      valid: false,
      status: 400,
      message:
        "This vendor call is inactive",
    };
  }

  // ----------------------------------------------
  // VENDOR CALL MUST BE OPEN
  // ----------------------------------------------
  if (
    vendorCall.status !== "open"
  ) {
    return {
      valid: false,
      status: 400,
      message:
        "This vendor call is not open for applications",
    };
  }

  // ----------------------------------------------
  // APPLICATION DATE MUST BE VALID
  // ----------------------------------------------
  const windowCheck =
    checkApplicationWindow(
      vendorCall
    );

  if (!windowCheck.valid) {
    return {
      valid: false,
      status: 400,
      message:
        windowCheck.message,
    };
  }

  // ----------------------------------------------
  // CHECK REMAINING SLOTS
  // ----------------------------------------------
  const approvedCount =
    await VendorApplication.countDocuments({
      vendorCall:
        vendorCall._id,

      status:
        "approved",
    });

  if (
    approvedCount >=
    vendorCall.totalSlots
  ) {
    return {
      valid: false,
      status: 400,
      message:
        "No vendor slots are available",
    };
  }

  return {
    valid: true,
  };
}

// ------------------------------------------------------
// GET ALL VENDOR APPLICATIONS
// ------------------------------------------------------
router.get(
  "/",
  async (req, res, next) => {
    try {
      const applications =
        await VendorApplication.find()
          .populate(
            "category",
            "name"
          )
          .populate({
            path: "vendorCall",
            select:
              "title event applicationStartDate applicationDeadline totalSlots boothFee boothSize status isActive",
            populate: {
              path: "event",
              select:
                "title startDate endDate startTime endTime status",
            },
          })
          .sort({
            createdAt: -1,
          });

      res.status(200).json(
        applications
      );
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------
// TRACK APPLICATION
// IMPORTANT: Keep this BEFORE /:id
//
// GET /api/vendor-applications/status
// ?applicationCode=...
// &email=...
// ------------------------------------------------------
router.get(
  "/status",
  async (req, res, next) => {
    try {
      const {
        applicationCode,
        email,
      } = req.query;

      if (
        !applicationCode ||
        !email
      ) {
        return res.status(400).json({
          message:
            "Application code and email are required",
        });
      }

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      const application =
        await VendorApplication.findOne({
          applicationCode:
            String(
              applicationCode
            ).trim(),

          email:
            normalizedEmail,
        })
          .populate(
            "category",
            "name"
          )
          .populate({
            path: "vendorCall",
            select:
              "title event applicationStartDate applicationDeadline totalSlots boothFee boothSize status isActive",
            populate: {
              path: "event",
              select:
                "title startDate endDate startTime endTime status",
            },
          });

      if (!application) {
        return res.status(404).json({
          message:
            "Application not found. Check your application code and email.",
        });
      }

      // Return the format expected
      // by TrackApplicationPage
      res.status(200).json({
        applicationCode:
          application.applicationCode,

        businessName:
          application.businessName,

        representativeName:
          application.representativeName,

        category:
          application.category,

        status:
          application.status,

        organizerRemarks:
          application.organizerRemarks ||
          "",

        reviewedAt:
          application.reviewedAt ||
          null,

        submittedAt:
          application.createdAt,

        vendorCall:
          application.vendorCall,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------
// CHANGE APPLICATION STATUS
// PATCH /api/vendor-applications/:id/status
// ------------------------------------------------------
router.patch(
  "/:id/status",
  async (req, res, next) => {
    try {
      const {
        status,
        organizerRemarks,
      } = req.body;

      if (
        ![
          "approved",
          "rejected",
        ].includes(status)
      ) {
        return res.status(400).json({
          message:
            "Status must be approved or rejected",
        });
      }

      const application =
        await VendorApplication.findById(
          req.params.id
        );

      if (!application) {
        return res.status(404).json({
          message:
            "Vendor application not found",
        });
      }

      // ----------------------------------------------
      // ONLY PENDING APPLICATIONS CAN BE REVIEWED
      // ----------------------------------------------
      if (
        application.status !==
        "pending"
      ) {
        return res.status(400).json({
          message:
            "Only pending applications can be reviewed",
        });
      }

      // ----------------------------------------------
      // APPROVAL NEEDS FULL BUSINESS RULE CHECK
      // ----------------------------------------------
      if (
        status === "approved"
      ) {
        const vendorCall =
          await getVendorCallWithEvent(
            application.vendorCall
          );

        const validation =
          await validateVendorCallForApplication(
            vendorCall
          );

        if (!validation.valid) {
          return res
            .status(
              validation.status
            )
            .json({
              message:
                validation.message,
            });
        }
      }

      // ----------------------------------------------
      // REJECTION
      // ----------------------------------------------
      if (
        status === "rejected"
      ) {
        if (
          !organizerRemarks ||
          !organizerRemarks.trim()
        ) {
          return res.status(400).json({
            message:
              "A rejection reason is required",
          });
        }
      }

      application.status =
        status;

      application.organizerRemarks =
        organizerRemarks
          ? organizerRemarks.trim()
          : "";

      application.reviewedAt =
        new Date();

      await application.save();

      const populatedApplication =
        await getPopulatedApplication(
          application._id
        );

      res.status(200).json({
        message:
          status === "approved"
            ? "Vendor application approved successfully"
            : "Vendor application rejected successfully",

        application:
          populatedApplication,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------
// GET ONE APPLICATION
// ------------------------------------------------------
router.get(
  "/:id",
  async (req, res, next) => {
    try {
      const application =
        await getPopulatedApplication(
          req.params.id
        );

      if (!application) {
        return res.status(404).json({
          message:
            "Vendor application not found",
        });
      }

      res.status(200).json(
        application
      );
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------
// CREATE VENDOR APPLICATION
// ------------------------------------------------------
router.post(
  "/",
  async (req, res, next) => {
    try {
      const {
        vendorCall,
        businessName,
        representativeName,
        email,
        contactNumber,
        category,
        products,
        businessDescription,
        socialMedia,
        notes,
      } = req.body;

      // ----------------------------------------------
      // REQUIRED FIELDS
      // ----------------------------------------------
      if (!vendorCall) {
        return res.status(400).json({
          message:
            "Vendor call is required",
        });
      }

      if (!category) {
        return res.status(400).json({
          message:
            "Category is required",
        });
      }

      if (!email) {
        return res.status(400).json({
          message:
            "Email is required",
        });
      }

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      // ----------------------------------------------
      // GET VENDOR CALL + PARENT EVENT
      // ----------------------------------------------
      const selectedVendorCall =
        await getVendorCallWithEvent(
          vendorCall
        );

      // ----------------------------------------------
      // IMPORTANT BUSINESS RULES
      // ----------------------------------------------
      const validation =
        await validateVendorCallForApplication(
          selectedVendorCall
        );

      if (!validation.valid) {
        return res
          .status(
            validation.status
          )
          .json({
            message:
              validation.message,
          });
      }

      // ----------------------------------------------
      // CATEGORY MUST BE ACCEPTED
      // ----------------------------------------------
      const acceptedCategory =
        selectedVendorCall.acceptedCategories.some(
          (acceptedCategoryId) =>
            acceptedCategoryId.toString() ===
            category.toString()
        );

      if (!acceptedCategory) {
        return res.status(400).json({
          message:
            "The selected category is not accepted for this vendor call",
        });
      }

      // ----------------------------------------------
      // CATEGORY MUST EXIST
      // ----------------------------------------------
      const categoryExists =
        await Category.exists({
          _id: category,
        });

      if (!categoryExists) {
        return res.status(404).json({
          message:
            "Category not found",
        });
      }

      // ----------------------------------------------
      // PREVENT DUPLICATE APPLICATION
      // Same email + same Vendor Call
      // ----------------------------------------------
      const existingApplication =
        await VendorApplication.findOne({
          vendorCall:
            selectedVendorCall._id,

          email:
            normalizedEmail,
        });

      if (existingApplication) {
        return res.status(400).json({
          message:
            "This email has already submitted an application for this vendor call",
        });
      }

      // ----------------------------------------------
      // GENERATE TRACKING CODE
      // ----------------------------------------------
      const applicationCode =
        `POP-APP-${Date.now()}`;

      // ----------------------------------------------
      // CREATE APPLICATION
      // Client cannot control:
      // - status
      // - applicationCode
      // - reviewedAt
      // - organizerRemarks
      // ----------------------------------------------
      const application =
        await VendorApplication.create({
          vendorCall:
            selectedVendorCall._id,

          applicationCode,

          businessName,

          representativeName,

          email:
            normalizedEmail,

          contactNumber,

          category,

          products,

          businessDescription,

          socialMedia:
            socialMedia || "",

          notes:
            notes || "",

          status:
            "pending",

          organizerRemarks:
            "",

          reviewedAt:
            null,
        });

      const populatedApplication =
        await getPopulatedApplication(
          application._id
        );

      res.status(201).json(
        populatedApplication
      );
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------
// UPDATE APPLICATION DETAILS
// ------------------------------------------------------
router.patch(
  "/:id",
  async (req, res, next) => {
    try {
      const application =
        await VendorApplication.findById(
          req.params.id
        );

      if (!application) {
        return res.status(404).json({
          message:
            "Vendor application not found",
        });
      }

      // Only pending applications
      // should have editable details.
      if (
        application.status !==
        "pending"
      ) {
        return res.status(400).json({
          message:
            "Only pending applications can be edited",
        });
      }

      const updates = {
        ...req.body,
      };

      // ----------------------------------------------
      // PROTECT SYSTEM-CONTROLLED FIELDS
      // ----------------------------------------------
      delete updates.vendorCall;
      delete updates.applicationCode;
      delete updates.status;
      delete updates.organizerRemarks;
      delete updates.reviewedAt;

      if (updates.email) {
        updates.email =
          updates.email
            .trim()
            .toLowerCase();
      }

      Object.assign(
        application,
        updates
      );

      await application.save();

      const populatedApplication =
        await getPopulatedApplication(
          application._id
        );

      res.status(200).json(
        populatedApplication
      );
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------
// DELETE APPLICATION
// ------------------------------------------------------
router.delete(
  "/:id",
  async (req, res, next) => {
    try {
      const application =
        await VendorApplication.findById(
          req.params.id
        );

      if (!application) {
        return res.status(404).json({
          message:
            "Vendor application not found",
        });
      }

      // Keep reviewed application records.
      if (
        application.status !==
        "pending" &&
        application.status !==
        "withdrawn"
      ) {
        return res.status(400).json({
          message:
            "Reviewed vendor applications cannot be deleted",
        });
      }

      await application.deleteOne();

      res.status(200).json({
        message:
          "Vendor application deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;