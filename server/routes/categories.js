const express = require("express");

const Category = require("../models/Category");

const Event = require("../models/Event");

const VendorCall = require(
  "../models/VendorCall"
);

const VendorApplication = require(
  "../models/VendorApplication"
);

const router = express.Router();

// ------------------------------------------------------
// GET ALL CATEGORIES
// ------------------------------------------------------
router.get("/", async (req, res, next) => {
  try {
    const categories =
      await Category.find().sort({
        name: 1,
      });

    res.status(200).json(
      categories
    );
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------
// GET ONE CATEGORY
// ------------------------------------------------------
router.get("/:id", async (req, res, next) => {
  try {
    const category =
      await Category.findById(
        req.params.id
      );

    if (!category) {
      return res.status(404).json({
        message:
          "Category not found",
      });
    }

    res.status(200).json(
      category
    );
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------
// CREATE CATEGORY
// ------------------------------------------------------
router.post("/", async (req, res, next) => {
  try {
    const category =
      await Category.create(
        req.body
      );

    res.status(201).json(
      category
    );
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------
// UPDATE CATEGORY
// ------------------------------------------------------
router.patch("/:id", async (req, res, next) => {
  try {
    const category =
      await Category.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!category) {
      return res.status(404).json({
        message:
          "Category not found",
      });
    }

    res.status(200).json(
      category
    );
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------
// DELETE CATEGORY
// ------------------------------------------------------
router.delete("/:id", async (req, res, next) => {
  try {
    const category =
      await Category.findById(
        req.params.id
      );

    if (!category) {
      return res.status(404).json({
        message:
          "Category not found",
      });
    }

    // --------------------------------------------------
    // CHECK EVENTS
    // --------------------------------------------------
    const eventCount =
      await Event.countDocuments({
        categories: category._id,
      });

    // --------------------------------------------------
    // CHECK VENDOR CALLS
    // --------------------------------------------------
    const vendorCallCount =
      await VendorCall.countDocuments({
        acceptedCategories:
          category._id,
      });

    // --------------------------------------------------
    // CHECK VENDOR APPLICATIONS
    // --------------------------------------------------
    const vendorApplicationCount =
      await VendorApplication.countDocuments({
        category: category._id,
      });

    const totalReferences =
      eventCount +
      vendorCallCount +
      vendorApplicationCount;

    if (totalReferences > 0) {
      return res.status(400).json({
        message:
          "This category cannot be deleted because it is currently used by events, vendor calls, or vendor applications",

        references: {
          events:
            eventCount,

          vendorCalls:
            vendorCallCount,

          vendorApplications:
            vendorApplicationCount,
        },
      });
    }

    await category.deleteOne();

    res.status(200).json({
      message:
        "Category deleted successfully",
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;