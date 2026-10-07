const express = require("express");
const Organizer = require("../models/Organizer");
const Event = require("../models/Event");
const Post = require("../models/Announcement");
const { fail } = require("../utils/access");
const { populateEvents, serializeEvent } = require("./events");
const router = express.Router();
const publicFields =
  "name description email contactNumber city socialMedia logoUrl user createdAt";
router.get("/", async (req, res) =>
  res.json(
    await Organizer.find({ isActive: true })
      .select(publicFields)
      .sort({ name: 1 }),
  ),
);
router.get("/:id", async (req, res) => {
  const profile = await Organizer.findOne({
    _id: req.params.id,
    isActive: true,
  }).select(publicFields);
  if (!profile) fail(404, "Organizer not found");
  const events = (
    await populateEvents(
      Event.find({ organizer: profile._id, status: "published" }).sort({
        startDate: 1,
      }),
    )
  ).map(serializeEvent);
  const posts = await Post.find({
    event: { $in: events.map((e) => e._id) },
    isPublished: true,
  })
    .populate({
      path: "event",
      populate: { path: "organizer", select: publicFields },
    })
    .sort({ publishedAt: -1 })
    .limit(30);
  res.json({ profile, events, posts });
});
module.exports = router;
