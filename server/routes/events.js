const express = require("express");
const Event = require("../models/Event");
const VendorCall = require("../models/VendorCall");
const Application = require("../models/VendorApplication");
const Post = require("../models/Announcement");
const Venue = require("../models/Venue");
const Category = require("../models/Category");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const {
  fail,
  pick,
  organizerFor,
  ownedEvent,
  ownEventIds,
  readableEvent,
  imageUrl,
} = require("../utils/access");
const eventReferences = require("../utils/eventReferences");
const { eventState } = require("../utils/eventState");
const { applicationEventFilter } = require("../utils/applicationAccess");
const { vendorSlots } = require("../utils/vendorSlots");
const router = express.Router();
const fields = [
  "title",
  "description",
  "venue",
  "categories",
  "startDate",
  "endDate",
  "startTime",
  "endTime",
  "posterUrl",
  "isFeatured",
];
function populate(query) {
  return query
    .populate(
      "organizer",
      "name description city logoUrl user email contactNumber socialMedia",
    )
    .populate("venue")
    .populate("categories");
}
function serialize(event) {
  const data = event.toObject ? event.toObject() : event;
  return {
    ...data,
    status: ["pending", "rejected"].includes(data.status)
      ? "draft"
      : data.status,
    ...eventState(data),
  };
}
async function validate(event) {
  const error = await eventReferences(event);
  if (error) fail(error.status, error.message);
  if (new Date(event.endDate) < new Date(event.startDate))
    fail(400, "End date cannot precede start date");
  if (
    String(event.startDate) === String(event.endDate) &&
    event.endTime <= event.startTime
  )
    fail(400, "End time must follow start time");
  if (event.posterUrl && !imageUrl(event.posterUrl))
    fail(400, "Use an image uploaded through POPP’IN");
}
const escape = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
router.get("/discover", async (req, res) => {
  const { search, city, category, featured, from, to, state } = req.query;
  const filter = { status: "published" };
  if (search)
    filter.$or = ["title", "description"].map((field) => ({
      [field]: { $regex: escape(search), $options: "i" },
    }));
  if (city)
    filter.venue = {
      $in: (
        await Venue.find({
          city: { $regex: escape(city), $options: "i" },
        }).select("_id")
      ).map((v) => v._id),
    };
  if (category)
    filter.categories = {
      $in: (
        await Category.find({
          name: { $regex: escape(category), $options: "i" },
        }).select("_id")
      ).map((c) => c._id),
    };
  if (featured === "true") filter.isFeatured = true;
  if (from || to) {
    if (
      (from && Number.isNaN(Date.parse(from))) ||
      (to && Number.isNaN(Date.parse(to)))
    )
      fail(400, "Invalid date filter");
    if (from) filter.endDate = { $gte: new Date(from) };
    if (to) filter.startDate = { $lte: new Date(to) };
  }
  let events = (await populate(Event.find(filter).sort({ startDate: 1 }))).map(
    serialize,
  );
  if (state) events = events.filter((e) => e.eventState === state);
  res.json({
    count: events.length,
    filters: {
      search: search || null,
      city: city || null,
      category: category || null,
      featured: featured === "true",
    },
    events,
  });
});
router.get("/mine", requireAuth, async (req, res) => {
  const events = await populate(
    Event.find({ _id: { $in: await ownEventIds(req.user) } }).sort({
      createdAt: -1,
    }),
  );
  const calls = await VendorCall.find({
    event: { $in: events.map((e) => e._id) },
  }).select("event totalSlots");
  const counts = await Application.aggregate([
    { $match: { vendorCall: { $in: calls.map((c) => c._id) } } },
    {
      $group: {
        _id: { call: "$vendorCall", status: "$status" },
        count: { $sum: 1 },
      },
    },
  ]);
  res.json(
    events.map((event) => {
      const eventCalls = calls.filter(
        (call) => String(call.event) === String(event._id),
      );
      const ids = new Set(eventCalls.map((call) => String(call._id)));
      const eventCounts = counts.filter((item) =>
        ids.has(String(item._id.call)),
      );
      const accepted = eventCounts.filter((item) =>
        ["accepted", "approved"].includes(item._id.status),
      );
      const acceptedByCall = eventCalls.map((call) => ({
        _id: call._id,
        count: accepted
          .filter((item) => String(item._id.call) === String(call._id))
          .reduce((sum, item) => sum + item.count, 0),
      }));
      const slots = vendorSlots(eventCalls, acceptedByCall);
      return {
        ...serialize(event),
        managementStats: {
          totalApplications: eventCounts.reduce(
            (sum, item) => sum + item.count,
            0,
          ),
          pendingApplications: eventCounts
            .filter((item) => item._id.status === "pending")
            .reduce((sum, item) => sum + item.count, 0),
          acceptedVendors: accepted.reduce((sum, item) => sum + item.count, 0),
          totalSlots: slots.total,
          remainingSlots: slots.available,
        },
      };
    }),
  );
});
router.get("/", async (req, res) =>
  res.json(
    (
      await populate(Event.find({ status: "published" }).sort({ startDate: 1 }))
    ).map(serialize),
  ),
);
router.get("/public/:id", async (req, res) => {
  const event = await populate(
    Event.findOne({ _id: req.params.id, status: "published" }),
  );
  if (!event) fail(404, "Published event not found");
  res.json(serialize(event));
});
router.get("/:id/vendors", optionalAuth, async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) fail(404, "Event not found");
  if (event.status !== "published") await readableEvent(req.user, event);
  const applications = await Application.find({
    ...(await applicationEventFilter(event._id)),
    status: { $in: ["accepted", "approved"] },
  })
    .sort({ createdAt: 1 })
    .populate("category", "name")
    .populate({
      path: "vendor",
      select: "logoUrl",
    });
  res.json(
    applications.map((app) => ({
      _id: app._id,
      businessName: app.businessName,
      category: app.category,
      products: app.products,
      description: app.businessDescription || "",
      socialMedia: app.socialMedia || "",
      ...(app.vendor
        ? { vendorId: app.vendor._id, logoUrl: app.vendor.logoUrl || "" }
        : {}),
    })),
  );
});
router.get("/:id", optionalAuth, async (req, res) => {
  const event = await populate(Event.findById(req.params.id));
  if (!event) fail(404, "Event not found");
  if (event.status !== "published") await readableEvent(req.user, event);
  res.json(serialize(event));
});
router.post("/", requireAuth, async (req, res) => {
  const organizer = await organizerFor(req.user);
  if (
    req.body.organizer &&
    String(req.body.organizer) !== String(organizer._id)
  )
    fail(403, "You cannot create events for another organizer");
  const event = new Event({
    ...pick(req.body, fields),
    organizer: organizer._id,
    status: "draft",
  });
  await validate(event);
  await event.save();
  res.status(201).json(serialize(await populate(Event.findById(event._id))));
});
router.patch("/:id/status", requireAuth, async (req, res) => {
  const event = await ownedEvent(req.user, req.params.id);
  const current = ["pending", "rejected"].includes(event.status)
    ? "draft"
    : event.status;
  const allowed = {
    draft: ["published"],
    published: ["cancelled"],
    cancelled: [],
  };
  if (!allowed[current]?.includes(req.body.status))
    fail(400, "Only a draft can be published, or a published event cancelled");
  if (req.body.status === "published") {
    await validate(event);
    event.publishedAt = new Date();
  }
  event.status = req.body.status;
  await event.save();
  res.json({
    message: "Event " + event.status,
    event: serialize(await populate(Event.findById(event._id))),
  });
});
router.patch("/:id", requireAuth, async (req, res) => {
  const event = await ownedEvent(req.user, req.params.id);
  if (event.status === "cancelled")
    fail(400, "Cancelled events cannot be edited");
  if (
    req.body.organizer &&
    String(req.body.organizer) !== String(event.organizer)
  )
    fail(403, "Event ownership cannot be changed");
  Object.assign(event, pick(req.body, fields));
  if (["pending", "rejected"].includes(event.status)) event.status = "draft";
  await validate(event);
  await event.save();
  res.json(serialize(await populate(Event.findById(event._id))));
});
router.delete("/:id", requireAuth, async (req, res) => {
  const event = await ownedEvent(req.user, req.params.id);
  if (
    (await VendorCall.exists({ event: event._id })) ||
    (await Post.exists({ event: event._id }))
  )
    fail(
      400,
      "Remove the event’s posts and empty vendor calls first, or cancel the event",
    );
  await event.deleteOne();
  res.json({ message: "Event deleted" });
});
module.exports = router;
module.exports.populateEvents = populate;
module.exports.serializeEvent = serialize;
