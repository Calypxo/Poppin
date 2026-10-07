const express = require("express");
const Call = require("../models/VendorCall");
const Application = require("../models/VendorApplication");
const Event = require("../models/Event");
const Category = require("../models/Category");
const { optionalAuth, requireAuth } = require("../middleware/auth");
const { fail, pick, ownedEvent, ownEventIds } = require("../utils/access");
const { callAvailability } = require("../utils/callAvailability");
const router = express.Router();
const populate = (query) =>
  query
    .populate({
      path: "event",
      populate: [
        { path: "organizer", select: "name city logoUrl user" },
        { path: "venue" },
        { path: "categories" },
      ],
    })
    .populate("acceptedCategories");
const fields = [
  "title",
  "description",
  "applicationStartDate",
  "applicationDeadline",
  "totalSlots",
  "boothFee",
  "boothSize",
  "requirements",
  "acceptedCategories",
  "status",
  "isActive",
];
async function readable(req, call) {
  if (!call) fail(404, "Vendor call not found");
  if (
    call.event?.status !== "published" ||
    call.status === "draft" ||
    !call.isActive
  )
    await ownedEvent(req.user, call.event?._id);
}
router.get("/mine", requireAuth, async (req, res) =>
  res.json(
    await populate(
      Call.find({ event: { $in: await ownEventIds(req.user) } }).sort({
        createdAt: -1,
      }),
    ),
  ),
);
router.get("/", async (req, res) => {
  const events = await Event.find({ status: "published" }).select("_id");
  const calls = await populate(
    Call.find({
      event: { $in: events.map((e) => e._id) },
      status: "open",
      isActive: true,
    }).sort({ applicationDeadline: 1 }),
  );
  res.json(
    await Promise.all(
      calls.map(async (c) => ({
        ...c.toObject(),
        ...(await callAvailability(c)),
      })),
    ),
  );
});
router.get("/event/:eventId", async (req, res) => {
  if (!(await Event.exists({ _id: req.params.eventId, status: "published" })))
    fail(404, "Published event not found");
  res.json(
    await populate(
      Call.findOne({
        event: req.params.eventId,
        status: "open",
        isActive: true,
      }).sort({ createdAt: -1 }),
    ),
  );
});
router.get("/:id/availability", optionalAuth, async (req, res) => {
  const call = await populate(Call.findById(req.params.id));
  await readable(req, call);
  res.json(await callAvailability(call));
});
router.get("/:id", optionalAuth, async (req, res) => {
  const call = await populate(Call.findById(req.params.id));
  await readable(req, call);
  res.json(call);
});
async function save(req, res, creating) {
  const call = creating
    ? new Call({ event: req.body.event })
    : await Call.findById(req.params.id);
  if (!call) fail(404, "Vendor call not found");
  const event = await ownedEvent(req.user, call.event);
  if (
    !creating &&
    req.body.event &&
    String(req.body.event) !== String(call.event)
  )
    fail(400, "Vendor calls cannot be moved between events");
  Object.assign(call, pick(req.body, fields));
  if (call.applicationDeadline < call.applicationStartDate)
    fail(400, "Application deadline cannot precede opening date");
  if (call.status === "open" && event.status !== "published")
    fail(400, "Publish the event before opening applications");
  const categoryIds = [...new Set(call.acceptedCategories.map(String))];
  if (
    (await Category.countDocuments({ _id: { $in: categoryIds } })) !==
    categoryIds.length
  )
    fail(400, "Choose existing categories");
  if (!creating) {
    const accepted = await Application.countDocuments({
      vendorCall: call._id,
      status: { $in: ["accepted", "approved"] },
    });
    if (call.totalSlots < accepted)
      fail(400, "Slots cannot be fewer than the accepted vendors");
  }
  await call.save();
  res
    .status(creating ? 201 : 200)
    .json(await populate(Call.findById(call._id)));
}
router.post("/", requireAuth, (req, res) => save(req, res, true));
router.patch("/:id", requireAuth, (req, res) => save(req, res, false));
router.delete("/:id", requireAuth, async (req, res) => {
  const call = await Call.findById(req.params.id);
  if (!call) fail(404, "Vendor call not found");
  await ownedEvent(req.user, call.event);
  if (await Application.exists({ vendorCall: call._id }))
    fail(
      400,
      "Calls with applications cannot be deleted; close the call instead",
    );
  await call.deleteOne();
  res.json({ message: "Vendor call deleted" });
});
module.exports = router;
