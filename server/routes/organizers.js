const express = require("express");
const Organizer = require("../models/Organizer");

const router = express.Router();

// ------------------------------------------------------
// GET ALL ORGANIZERS
// ------------------------------------------------------
router.get("/", async (req, res, next) => {
  try {
    const organizers = await Organizer.find().sort({
      createdAt: -1,
    });

    res.status(200).json(organizers);
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------
// UPDATE ORGANIZER VERIFICATION STATUS
// PATCH /api/organizers/:id/status
// ------------------------------------------------------
router.patch("/:id/status", async (req, res, next) => {
  try {
    const {
      status,
      rejectionReason,
    } = req.body;

    if (
      !["verified", "rejected"].includes(status)
    ) {
      return res.status(400).json({
        message:
          "Status must be verified or rejected",
      });
    }

    const organizer =
      await Organizer.findById(req.params.id);

    if (!organizer) {
      return res.status(404).json({
        message: "Organizer not found",
      });
    }

    // Only pending organizers should be reviewed
    if (organizer.status !== "pending") {
      return res.status(400).json({
        message:
          "Only pending organizers can be reviewed",
      });
    }

    // Rejection requires a reason
    if (status === "rejected") {
      if (
        !rejectionReason ||
        !rejectionReason.trim()
      ) {
        return res.status(400).json({
          message:
            "Rejection reason is required",
        });
      }

      organizer.rejectionReason =
        rejectionReason.trim();
    }

    // Clear rejection reason when verified
    if (status === "verified") {
      organizer.rejectionReason = "";
    }

    organizer.status = status;

    await organizer.save();

    res.status(200).json({
      message:
        status === "verified"
          ? "Organizer verified successfully"
          : "Organizer rejected successfully",

      organizer,
    });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------
// GET ONE ORGANIZER
// ------------------------------------------------------
router.get("/:id", async (req, res, next) => {
  try {
    const organizer =
      await Organizer.findById(req.params.id);

    if (!organizer) {
      return res.status(404).json({
        message: "Organizer not found",
      });
    }

    res.status(200).json(organizer);
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------
// CREATE ORGANIZER
// New organizers always begin as pending.
// ------------------------------------------------------
router.post("/", async (req, res, next) => {
  try {
    const organizerData = {
      ...req.body,

      status: "pending",

      rejectionReason: "",
    };

    const organizer =
      await Organizer.create(organizerData);

    res.status(201).json(organizer);
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------
// UPDATE ORGANIZER DETAILS
// Verification status cannot be changed here.
// ------------------------------------------------------
router.patch("/:id", async (req, res, next) => {
  try {
    const updates = {
      ...req.body,
    };

    // Protect admin-controlled fields
    delete updates.status;
    delete updates.rejectionReason;

    const organizer =
      await Organizer.findByIdAndUpdate(
        req.params.id,
        updates,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!organizer) {
      return res.status(404).json({
        message: "Organizer not found",
      });
    }

    res.status(200).json(organizer);
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------
// DELETE ORGANIZER
// ------------------------------------------------------
router.delete("/:id", async (req, res, next) => {
  try {
    const organizer =
      await Organizer.findByIdAndDelete(
        req.params.id
      );

    if (!organizer) {
      return res.status(404).json({
        message: "Organizer not found",
      });
    }

    res.status(200).json({
      message:
        "Organizer deleted successfully",
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;