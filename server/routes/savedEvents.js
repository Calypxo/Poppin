const express = require("express");
const mongoose = require("mongoose");
const SavedEvent = require("../models/SavedEvent");
const Event = require("../models/Event");
const { requireAuth } = require("../middleware/auth");
const { fail } = require("../utils/access");
const { populateEvents, serializeEvent } = require("./events");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const saved = await SavedEvent.find({ user: req.user._id })
    .sort({ createdAt: -1, _id: -1 })
    .lean();
  const events = await populateEvents(
    Event.find({
      _id: { $in: saved.map((item) => item.event) },
      status: { $in: ["published", "cancelled"] },
    }),
  );
  const byId = new Map(events.map((event) => [String(event._id), serializeEvent(event)]));
  res.json(saved.map((item) => ({
    eventId: String(item.event),
    savedAt: item.createdAt,
    // Deleted or withdrawn events can still be removed without revealing drafts.
    event: byId.get(String(item.event)) || null,
  })));
});

router.param("eventId", (req, res, next, id) => {
  if (!mongoose.isObjectIdOrHexString(id)) return next(Object.assign(
    new Error("Invalid event ID"), { status: 400 },
  ));
  next();
});

router.put("/:eventId", async (req, res) => {
  const eventId = req.params.eventId;
  if (!(await Event.exists({ _id: eventId, status: "published" })))
    fail(404, "This event is no longer available to save");
  let created = false;
  try {
    const result = await SavedEvent.updateOne(
      { user: req.user._id, event: eventId },
      { $setOnInsert: { user: req.user._id, event: eventId } },
      { upsert: true, runValidators: true, timestamps: { updatedAt: false } },
    );
    created = result.upsertedCount > 0;
  } catch (error) {
    // A concurrent upsert may win the unique-index race. Both requests succeed.
    if (error.code !== 11000) throw error;
  }
  res.status(created ? 201 : 200).json({ eventId, saved: true });
});

router.delete("/:eventId", async (req, res) => {
  await SavedEvent.deleteOne({ user: req.user._id, event: req.params.eventId });
  res.json({ eventId: req.params.eventId, saved: false });
});

module.exports = router;
