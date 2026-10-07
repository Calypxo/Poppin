const express = require("express");

const Category = require("../models/Category");

const Event = require("../models/Event");

const VendorCall = require("../models/VendorCall");

const VendorApplication = require("../models/VendorApplication");

const { requireAuth } = require("../middleware/auth");
const { fail, pick } = require("../utils/access");
const router = express.Router();
router.use((req, res, next) => {
  if (["GET", "HEAD"].includes(req.method)) return next();
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    next();
  });
});
router.use(async (req, res, next) => {
  if (!["PATCH", "DELETE"].includes(req.method)) return next();
  try {
    const item = await Category.findById(
      req.params.id || req.path.split("/")[1],
    );
    if (!item) fail(404, "Record not found");
    if (String(item.createdBy) !== String(req.user._id))
      fail(403, "Only the creator can change this record");
    next();
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------
// GET ALL CATEGORIES
// ------------------------------------------------------
router.get("/", async (req, res, next) => {
  try {
    const categories = await Category.find().sort({
      name: 1,
    });

    res.status(200).json(categories);
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------
// GET ONE CATEGORY
// ------------------------------------------------------
router.get("/:id", async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    res.status(200).json(category);
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------
// CREATE CATEGORY
// ------------------------------------------------------
router.post("/", async (req, res, next) => {
  try {
    const category = await Category.create({
      ...pick(req.body, ["name", "description", "isActive"]),
      createdBy: req.user._id,
    });

    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------
// UPDATE CATEGORY
// ------------------------------------------------------
router.patch("/:id", async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      pick(req.body, ["name", "description", "isActive"]),
      {
        new: true,
        runValidators: true,
      },
    );

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    res.status(200).json(category);
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------
// DELETE CATEGORY
// ------------------------------------------------------
router.delete("/:id", async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    // --------------------------------------------------
    // CHECK EVENTS
    // --------------------------------------------------
    const eventCount = await Event.countDocuments({
      categories: category._id,
    });

    // --------------------------------------------------
    // CHECK VENDOR CALLS
    // --------------------------------------------------
    const vendorCallCount = await VendorCall.countDocuments({
      acceptedCategories: category._id,
    });

    // --------------------------------------------------
    // CHECK VENDOR APPLICATIONS
    // --------------------------------------------------
    const vendorApplicationCount = await VendorApplication.countDocuments({
      category: category._id,
    });

    const vendorProfileCount =
      await require("../models/VendorProfile").countDocuments({
        category: category._id,
      });
    const totalReferences =
      vendorProfileCount +
      eventCount +
      vendorCallCount +
      vendorApplicationCount;

    if (totalReferences > 0) {
      return res.status(400).json({
        message:
          "This category cannot be deleted because it is currently used by events, vendor calls, or vendor applications",

        references: {
          events: eventCount,

          vendorCalls: vendorCallCount,

          vendorApplications: vendorApplicationCount,
        },
      });
    }

    await category.deleteOne();

    res.status(200).json({
      message: "Category deleted successfully",
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
