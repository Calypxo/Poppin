const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../../models/User");
const Organizer = require("../../models/Organizer");
const Venue = require("../../models/Venue");
const Category = require("../../models/Category");
const Event = require("../../models/Event");
const SavedEvent = require("../../models/SavedEvent");

const ids = {
  upcoming: "000000000000000000000101",
  completed: "000000000000000000000102",
  cancelled: "000000000000000000000103",
  draft: "000000000000000000000104",
  deleted: "000000000000000000000105",
};
const password = "SavedEventsDemo123!";

async function seedSavedEventsData({ withSaved = false } = {}) {
  const passwordHash = await bcrypt.hash(password, 4);
  const [viewer, other, host, statusViewer] = await User.create([
    { name: "Test Viewer", email: "viewer@example.test", passwordHash },
    { name: "Other Viewer", email: "other@example.test", passwordHash },
    { name: "Test Host", email: "host@example.test", passwordHash },
    { name: "Status Viewer", email: "statuses@example.test", passwordHash },
  ]);
  const organizer = await Organizer.create({ user: host._id, name: "Local Test Host", email: "host@example.test", city: "Angeles" });
  const venue = await Venue.create({ name: "Community Hall", address: "Test Street", city: "Angeles", venueType: "Community Space" });
  const category = await Category.create({ name: "Local markets" });
  const day = (offset) => new Date(Date.now() + offset * 86400000);
  const base = {
    description: "Meet local makers and find your next good plan.",
    organizer: organizer._id, venue: venue._id, categories: [category._id],
    startTime: "09:00", endTime: "18:00", status: "published", posterUrl: "",
  };
  const [upcoming, completed, cancelled, draft] = await Event.create([
    { ...base, _id: ids.upcoming, title: "Future community market", startDate: day(7), endDate: day(8) },
    { ...base, _id: ids.completed, title: "Completed craft fair", startDate: day(-10), endDate: day(-9) },
    { ...base, _id: ids.cancelled, title: "Cancelled neighbourhood market", startDate: day(7), endDate: day(8), status: "cancelled" },
    { ...base, _id: ids.draft, title: "Private draft event", startDate: day(7), endDate: day(8), status: "draft" },
  ]);
  await SavedEvent.init();
  if (withSaved) await SavedEvent.create([
    { user: statusViewer._id, event: upcoming._id },
    { user: statusViewer._id, event: completed._id },
    { user: statusViewer._id, event: cancelled._id },
    { user: statusViewer._id, event: new mongoose.Types.ObjectId(ids.deleted) },
  ]);
  return { viewer, other, host, statusViewer, upcoming, completed, cancelled, draft };
}

module.exports = { seedSavedEventsData, ids, password };
