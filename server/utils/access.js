const Organizer = require("../models/Organizer");
const Event = require("../models/Event");
function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}
function pick(body, keys) {
  return Object.fromEntries(
    keys
      .filter((key) => Object.hasOwn(body, key))
      .map((key) => [key, body[key]]),
  );
}
async function organizerFor(user) {
  const organizer = await Organizer.findOne({ user: user._id, isActive: true });
  if (!organizer) fail(403, "An active organizer profile is required");
  return organizer;
}
async function ownedEvent(user, id, session = null) {
  const event = await Event.findById(id).session(session);
  if (!event) fail(404, "Event not found");
  const organizer = await Organizer.findById(event.organizer).session(session);
  if (
    !user ||
    !organizer?.isActive ||
    String(organizer.user) !== String(user._id)
  )
    fail(403, "You can only manage your own events");
  return event;
}
async function ownEventIds(user) {
  const organizer = await Organizer.findOne({ user: user._id, isActive: true });
  if (!organizer) return [];
  return (await Event.find({ organizer: organizer._id }).select("_id")).map(
    (e) => e._id,
  );
}
async function readableEvent(user, event) {
  if (event.status === "published") return;
  if (user) {
    try {
      await ownedEvent(user, event._id);
      return;
    } catch (error) {
      if (error.status !== 403) throw error;
    }
  }
  // People who saved an event can still read it after cancellation.
  if (user && event.status === "cancelled" &&
    await require("../models/SavedEvent").exists({ user: user._id, event: event._id }))
    return;
  // A confirmed vendor must still be able to read their cancelled booking.
  if (user && event.status === "cancelled") {
    const {
      applicantFilter,
      applicationEventFilter,
    } = require("./applicationAccess");
    if (
      await require("../models/VendorApplication").exists({
        $and: [
          await applicantFilter(user),
          await applicationEventFilter(event._id),
        ],
        status: { $in: ["accepted", "approved"] },
      })
    )
      return;
  }
  fail(403, "This event is available only to its owner and confirmed vendors");
}
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function imageUrl(value) {
  return (
    value === "" ||
    (typeof value === "string" &&
      /^https:\/\/res\.cloudinary\.com\//.test(value))
  );
}
module.exports = {
  fail,
  pick,
  organizerFor,
  ownedEvent,
  ownEventIds,
  readableEvent,
  emailPattern,
  imageUrl,
};
