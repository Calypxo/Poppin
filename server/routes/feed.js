const express = require("express");
const Event = require("../models/Event");
const Post = require("../models/Announcement");
const Call = require("../models/VendorCall");
const { populateEvents, serializeEvent } = require("./events");
const { callAvailability } = require("../utils/callAvailability");
const router = express.Router();
router.get("/", async (req, res) => {
  const events = await populateEvents(
    Event.find({ status: "published" }).sort({
      publishedAt: -1,
      createdAt: -1,
    }),
  );
  const byId = new Map(events.map((e) => [String(e._id), serializeEvent(e)]));
  const ids = events.map((e) => e._id);
  const [posts, calls] = await Promise.all([
    Post.find({ event: { $in: ids }, isPublished: true }),
    Call.find({ event: { $in: ids }, status: "open", isActive: true })
      .populate("event")
      .populate("acceptedCategories"),
  ]);
  const items = events.map((e) => ({
    _id: "event-" + e._id,
    kind: "event",
    type: "event",
    timestamp: e.publishedAt || e.createdAt,
    event: byId.get(String(e._id)),
  }));
  for (const post of posts)
    items.push({
      _id: "post-" + post._id,
      kind: "post",
      type: post.type,
      timestamp: post.publishedAt || post.createdAt,
      event: byId.get(String(post.event)),
      post,
    });
  for (const call of calls) {
    const availability = await callAvailability(call);
    if (["open", "upcoming", "full"].includes(availability.availability.status))
      items.push({
        _id: "call-" + call._id,
        kind: "vendor_call",
        type: "vendor_call",
        timestamp: call.createdAt,
        event: byId.get(String(call.event._id)),
        vendorCall: { ...call.toObject(), ...availability },
      });
  }
  items.sort(
    (a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp) ||
      String(a._id).localeCompare(String(b._id)),
  );
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const size = 20;
  res.json({
    items: items.slice((page - 1) * size, page * size),
    page,
    hasMore: page * size < items.length,
    count: items.length,
  });
});
module.exports = router;
