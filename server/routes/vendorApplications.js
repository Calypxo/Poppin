const express = require("express");
const mongoose = require("mongoose");
const { randomUUID } = require("node:crypto");
const Application = require("../models/VendorApplication");
const Call = require("../models/VendorCall");
const Category = require("../models/Category");
const { requireAuth } = require("../middleware/auth");
const {
  fail,
  ownedEvent,
  ownEventIds,
  emailPattern,
} = require("../utils/access");
const {
  applicantFilter,
  applicationEventFilter,
} = require("../utils/applicationAccess");
const { callAvailability } = require("../utils/callAvailability");
const router = express.Router();
router.use(requireAuth);
const populate = (query) =>
  query
    .populate("category")
    .populate("vendor", "businessName logoUrl user")
    .populate({
      path: "vendorCall",
      populate: {
        path: "event",
        populate: { path: "organizer", select: "name user logoUrl" },
      },
    });
function serialize(app) {
  return {
    ...app.toObject(),
    status: app.status === "approved" ? "accepted" : app.status,
  };
}
async function ownApplication(user, app) {
  if (!app) fail(404, "Application not found");
  if (
    !(await Application.exists({
      $and: [{ _id: app._id }, await applicantFilter(user)],
    }))
  )
    fail(403, "You can only change your own applications");
}
async function readableApplication(user, app) {
  if (!app) fail(404, "Application not found");
  if (
    await Application.exists({
      $and: [{ _id: app._id }, await applicantFilter(user)],
    })
  )
    return;
  const call = await Call.findById(app.vendorCall);
  if (!call) fail(404, "Vendor call not found");
  await ownedEvent(user, call.event);
}
router.get("/", async (req, res) => {
  for (const key of ["event", "vendorCall"])
    if (
      req.query[key] !== undefined &&
      !mongoose.isObjectIdOrHexString(req.query[key])
    )
      fail(400, `Choose a valid ${key}`);
  let filter;
  const view = req.query.view || "outgoing";
  if (!["outgoing", "incoming"].includes(view))
    fail(400, "Choose an application view");
  if (view === "outgoing") {
    filter = await applicantFilter(req.user);
  } else {
    const calls = await Call.find({
      event: { $in: await ownEventIds(req.user) },
    }).select("_id");
    filter = { vendorCall: { $in: calls.map((c) => c._id) } };
  }
  const filters = [filter];
  if (req.query.vendorCall) filters.push({ vendorCall: req.query.vendorCall });
  if (req.query.event)
    filters.push(await applicationEventFilter(req.query.event));
  res.json(
    (
      await populate(
        Application.find({ $and: filters }).sort({ createdAt: -1 }),
      )
    ).map(serialize),
  );
});
router.get("/:id", async (req, res) => {
  const app = await Application.findById(req.params.id);
  await readableApplication(req.user, app);
  res.json(serialize(await populate(Application.findById(app._id))));
});
router.post("/", async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.body.vendorCall))
    fail(400, "Choose a valid vendor call");
  if (!mongoose.isObjectIdOrHexString(req.body.category))
    fail(400, "Choose a valid business category");
  const fields = {};
  for (const [key, maximum, required] of [
    ["businessName", 150, true],
    ["products", 2000, true],
    ["contactNumber", 50, true],
    ["email", 254, true],
    ["businessDescription", 5000, false],
    ["socialMedia", 500, false],
    ["notes", 2000, false],
  ]) {
    const value = req.body[key] ?? "";
    if (
      typeof value !== "string" ||
      value.length > maximum ||
      (required && !value.trim())
    )
      fail(
        400,
        `Provide ${key} of ${required ? "1" : "0"}–${maximum} characters`,
      );
    fields[key] = value.trim();
  }
  if (!emailPattern.test(fields.email))
    fail(400, "Provide a valid contact email");
  if (
    !req.body.category ||
    !(await Category.exists({ _id: req.body.category }))
  )
    fail(400, "Choose an existing business category");
  let app;
  await mongoose.connection.transaction(async (session) => {
    // Lock recruitment while submitting so close/capacity changes cannot be missed.
    const call = await Call.findOneAndUpdate(
      { _id: req.body.vendorCall },
      { $inc: { __v: 1 } },
      { new: true, session },
    ).populate("event");
    if (!call) fail(404, "Vendor call not found");
    if (!(await callAvailability(call, session)).availability.canApply)
      fail(400, "This vendor call is not accepting applications");
    if (
      call.acceptedCategories.length &&
      !call.acceptedCategories.some(
        (c) => String(c) === String(req.body.category),
      )
    )
      fail(400, "Your business category is not accepted by this event");
    if (
      await Application.exists({
        $and: [
          await applicantFilter(req.user, session),
          await applicationEventFilter(call.event._id, session),
        ],
      }).session(session)
    )
      fail(409, "You already applied to this event");
    [app] = await Application.create(
      [
        {
          ...fields,
          user: req.user._id,
          event: call.event._id,
          vendorCall: call._id,
          applicationCode: "POP-" + randomUUID(),
          representativeName: req.user.name,
          category: req.body.category,
          status: "pending",
        },
      ],
      { session },
    );
  });
  res
    .status(201)
    .json(serialize(await populate(Application.findById(app._id))));
});
router.patch("/:id/status", async (req, res) => {
  if (!["accepted", "rejected"].includes(req.body.status))
    fail(400, "Choose accepted or rejected");
  if (
    typeof req.body.organizerRemarks !== "string" ||
    req.body.organizerRemarks.length > 2000 ||
    (req.body.status === "rejected" && !req.body.organizerRemarks.trim())
  )
    fail(400, "Provide a brief review note (required for rejection)");
  await mongoose.connection.transaction(async (session) => {
    const app = await Application.findById(req.params.id).session(session);
    if (!app) fail(404, "Application not found");
    if (app.status !== "pending")
      fail(400, "Only pending applications can be reviewed");
    // Both competing acceptances write this call, so transaction retry rechecks capacity.
    const call = await Call.findOneAndUpdate(
      { _id: app.vendorCall },
      { $inc: { __v: 1 } },
      { new: true, session },
    ).populate("event");
    if (!call) fail(404, "Vendor call not found");
    await ownedEvent(req.user, call.event._id, session);
    if (req.body.status === "accepted") {
      const available = await callAvailability(call, session);
      if (available.statistics.slotsRemaining <= 0)
        fail(400, "No vendor slots remaining for this event.");
      if (!available.availability.canApply)
        fail(400, "The vendor call is closed or past its deadline");
    }
    app.status = req.body.status;
    app.organizerRemarks = req.body.organizerRemarks.trim();
    app.reviewedAt = new Date();
    await app.save({ session });
  });
  res.json(serialize(await populate(Application.findById(req.params.id))));
});
router.patch("/:id", async (req, res) => {
  const app = await Application.findById(req.params.id);
  await ownApplication(req.user, app);
  if (app.status !== "pending")
    fail(400, "Only pending applications can be changed");
  if (req.body.status === "withdrawn") app.status = "withdrawn";
  else {
    if (typeof req.body.notes !== "string" || req.body.notes.length > 2000)
      fail(400, "Provide notes of at most 2000 characters");
    app.notes = req.body.notes;
  }
  await app.save();
  res.json(serialize(await populate(Application.findById(app._id))));
});
router.delete("/:id", async (req, res) => {
  const app = await Application.findById(req.params.id);
  await ownApplication(req.user, app);
  if (!["pending", "withdrawn"].includes(app.status))
    fail(400, "Reviewed applications cannot be deleted");
  const deleted = await Application.deleteOne({
    _id: app._id,
    __v: app.__v,
    status: { $in: ["pending", "withdrawn"] },
  });
  if (!deleted.deletedCount)
    fail(409, "This application changed. Refresh and try again.");
  res.json({ message: "Application deleted" });
});
module.exports = router;
