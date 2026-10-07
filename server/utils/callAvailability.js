const { vendorSlots } = require("./vendorSlots");
const Application = require("../models/VendorApplication");
const { eventState } = require("./eventState");
async function callAvailability(call, session = null) {
  const accepted = await Application.countDocuments({
    vendorCall: call._id,
    status: { $in: ["accepted", "approved"] },
  }).session(session);
  const slotsRemaining = vendorSlots(
    [call],
    [{ _id: call._id, count: accepted }],
  ).available;
  const now = new Date();
  let status = "closed";
  if (
    call.event?.status === "published" &&
    eventState(call.event).eventState !== "completed" &&
    call.isActive
  ) {
    if (call.status === "draft") status = "draft";
    else if (call.status === "open")
      status =
        now < call.applicationStartDate
          ? "upcoming"
          : now > call.applicationDeadline
            ? "closed"
            : slotsRemaining <= 0
              ? "full"
              : "open";
  }
  return {
    statistics: { acceptedApplications: accepted, slotsRemaining },
    availability: { status, canApply: status === "open" },
  };
}
module.exports = { callAvailability };
