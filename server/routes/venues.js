const express = require("express");

const Venue = require("../models/Venue");
const Event = require("../models/Event");

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
    const item = await Venue.findById(req.params.id || req.path.split("/")[1]);
    if (!item) fail(404, "Record not found");
    if (String(item.createdBy) !== String(req.user._id))
      fail(403, "Only the creator can change this record");
    next();
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------
// GET ALL VENUES
// ------------------------------------------------------
router.get("/", async (req, res, next) => {
  try {
    const venues = await Venue.find().sort({
      name: 1,
    });

    res.status(200).json(venues);
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------
// GET ONE VENUE
// ------------------------------------------------------
router.get("/:id", async (req, res, next) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      return res.status(404).json({
        message: "Venue not found",
      });
    }

    res.status(200).json(venue);
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------
// CREATE VENUE
// ------------------------------------------------------
router.post("/", async (req, res, next) => {
  try {
    const venue = await Venue.create({
      ...pick(req.body, [
        "name",
        "address",
        "city",
        "province",
        "venueType",
        "description",
        "isActive",
      ]),
      createdBy: req.user._id,
    });

    res.status(201).json(venue);
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------
// UPDATE VENUE
// ------------------------------------------------------
router.patch("/:id", async (req, res, next) => {
  try {
    const venue = await Venue.findByIdAndUpdate(
      req.params.id,
      pick(req.body, [
        "name",
        "address",
        "city",
        "province",
        "venueType",
        "description",
        "isActive",
      ]),
      {
        new: true,
        runValidators: true,
      },
    );

    if (!venue) {
      return res.status(404).json({
        message: "Venue not found",
      });
    }

    res.status(200).json(venue);
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------
// DELETE VENUE
// ------------------------------------------------------
router.delete("/:id", async (req, res, next) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      return res.status(404).json({
        message: "Venue not found",
      });
    }

    // --------------------------------------------------
    // CHECK IF ANY EVENT USES THIS VENUE
    // --------------------------------------------------
    const eventCount = await Event.countDocuments({
      venue: venue._id,
    });

    if (eventCount > 0) {
      return res.status(400).json({
        message:
          "This venue cannot be deleted because it is currently used by one or more events",
      });
    }

    await venue.deleteOne();

    res.status(200).json({
      message: "Venue deleted successfully",
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
