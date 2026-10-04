const express = require("express");
const Announcement = require("../models/Announcement");
const Event = require("../models/Event");

// Register referenced model
require("../models/Event");

const router = express.Router();

// ------------------------------------------------------
// GET ALL ANNOUNCEMENTS
// ------------------------------------------------------
router.get("/", async (req, res, next) => {
  try {
    const announcements =
      await Announcement.find()
        .populate(
          "event",
          "title startDate endDate status"
        )
        .sort({
          createdAt: -1,
        });

    res.status(200).json(
      announcements
    );
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------
// GET PUBLISHED ANNOUNCEMENTS FOR ONE EVENT
// IMPORTANT: Keep this BEFORE /:id
// ------------------------------------------------------
// ------------------------------------------------------
// GET PUBLIC ANNOUNCEMENTS FOR EVENT
// Event itself must still be published.
// ------------------------------------------------------
router.get(
  "/event/:eventId",
  async (req, res, next) => {
    try {
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

      const announcements =
        await Announcement.find({
          event: event._id,
          isPublished: true,
        })
          .populate(
            "event",
            "title startDate endDate status"
          )
          .sort({
            publishedAt: -1,
            createdAt: -1,
          });

      res.status(200).json(
        announcements
      );
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------
// GET ONE ANNOUNCEMENT
// ------------------------------------------------------
router.get(
  "/:id",
  async (req, res, next) => {
    try {
      const announcement =
        await Announcement.findById(
          req.params.id
        ).populate(
          "event",
          "title startDate endDate status"
        );

      if (!announcement) {
        return res.status(404).json({
          message:
            "Announcement not found",
        });
      }

      res.status(200).json(
        announcement
      );
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------
// CREATE ANNOUNCEMENT
// ------------------------------------------------------
router.post(
  "/",
  async (req, res, next) => {
    try {
      const data = {
        ...req.body,
      };

      // Server controls publication date
      if (data.isPublished) {
        data.publishedAt =
          new Date();
      } else {
        data.publishedAt = null;
      }

      const announcement =
        await Announcement.create(
          data
        );

      const populated =
        await Announcement.findById(
          announcement._id
        ).populate(
          "event",
          "title startDate endDate status"
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
// UPDATE ANNOUNCEMENT
// ------------------------------------------------------
router.patch(
  "/:id",
  async (req, res, next) => {
    try {
      const announcement =
        await Announcement.findById(
          req.params.id
        );

      if (!announcement) {
        return res.status(404).json({
          message:
            "Announcement not found",
        });
      }

      const wasPublished =
        announcement.isPublished;

      const updates = {
        ...req.body,
      };

      // Do not allow client to directly
      // control publication timestamp
      delete updates.publishedAt;

      Object.assign(
        announcement,
        updates
      );

      // Draft -> Published
      if (
        announcement.isPublished &&
        !wasPublished
      ) {
        announcement.publishedAt =
          new Date();
      }

      // Published -> Draft
      if (
        !announcement.isPublished
      ) {
        announcement.publishedAt =
          null;
      }

      await announcement.save();

      await announcement.populate(
        "event",
        "title startDate endDate status"
      );

      res.status(200).json(
        announcement
      );
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------
// DELETE ANNOUNCEMENT
// ------------------------------------------------------
router.delete(
  "/:id",
  async (req, res, next) => {
    try {
      const announcement =
        await Announcement.findByIdAndDelete(
          req.params.id
        );

      if (!announcement) {
        return res.status(404).json({
          message:
            "Announcement not found",
        });
      }

      res.status(200).json({
        message:
          "Announcement deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;