const express = require("express");
const Vendor = require("../models/VendorProfile");
const Application = require("../models/VendorApplication");
const VendorCall = require("../models/VendorCall");
const Event = require("../models/Event");
const { requireAuth } = require("../middleware/auth");
const { fail } = require("../utils/access");
const { applicantFilter } = require("../utils/applicationAccess");
const { populateEvents, serializeEvent } = require("./events");
const router = express.Router();
async function confirmed(applicant, publicOnly) {
  const applications = await Application.find({
    ...applicant,
    status: { $in: ["accepted", "approved"] },
  }).select("vendorCall event");
  const calls = await VendorCall.find({
    _id: { $in: applications.map((a) => a.vendorCall) },
  }).select("event");
  const filter = {
    _id: {
      $in: [
        ...calls.map((c) => c.event),
        ...applications.map((a) => a.event).filter(Boolean),
      ],
    },
  };
  if (publicOnly) filter.status = "published";
  return (await populateEvents(Event.find(filter).sort({ startDate: 1 }))).map(
    serializeEvent,
  );
}
router.get("/me/confirmed-events", requireAuth, async (req, res) => {
  res.json(await confirmed(await applicantFilter(req.user), false));
});
router.get("/:id", async (req, res) => {
  const profile = await Vendor.findById(req.params.id).populate("category");
  if (!profile) fail(404, "Vendor not found");
  res.json({
    profile,
    events: await confirmed({ vendor: profile._id }, true),
    posts: [],
  });
});
module.exports = router;
