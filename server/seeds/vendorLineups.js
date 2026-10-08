const { randomBytes } = require("node:crypto");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const Organizer = require("../models/Organizer");
const Venue = require("../models/Venue");
const Category = require("../models/Category");
const Event = require("../models/Event");
const VendorCall = require("../models/VendorCall");
const Application = require("../models/VendorApplication");
const posters = require("../data/poster-events.json");
const { vendors, lineups } = require("../data/vendor-lineups");

const normalize = (text) => text.trim().normalize("NFKC").toLowerCase();
const demoNote = "School-project demo fixture. Vendor/event associations and descriptions are illustrative, not verified historical participation.";
const day = 86400000;
const insertOnly = async (Model, filter, values, session) => {
  const existing = await Model.findOne(filter).session(session);
  if (existing) return existing;
  const [created] = await Model.create([values], { session });
  return created;
};

// Only used after the existing empty-database guard, never in additive mode.
async function createPosterEvents(passwordHash, session) {
  for (const lineup of lineups) {
    const entry = posters.events.find((item) => item.title === lineup.title);
    if (!entry) throw new Error(`Missing poster manifest entry: ${lineup.title}`);
    let organizer = await Organizer.findOne({ name: entry.organizer }).session(session);
    if (!organizer) {
      const email = `organizer-${entry.organizer.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.demo@example.invalid`;
      const user = await insertOnly(User, { email }, { name: entry.organizer, email, passwordHash }, session);
      organizer = await insertOnly(Organizer, { email }, {
        user: user._id, name: entry.organizer, email, city: "Pampanga", contactNumber: "00000000000",
        description: "Local market organizer for the school-project demonstration.",
      }, session);
    }
    const venueData = posters.venues.find((venue) => venue.name === entry.venue);
    const venue = await Venue.findOne({ name: entry.venue }).session(session) ||
      (venueData && await insertOnly(Venue, { name: venueData.name }, venueData, session));
    if (!venue) throw new Error(`Missing venue: ${entry.venue}`);
    const categories = await Category.find({ name: { $in: entry.categories } }).session(session);
    if (categories.length !== entry.categories.length) throw new Error(`Missing event categories: ${entry.title}`);
    const startDate = new Date(`${entry.start}T${entry.startTime === "TBA" ? "00:00" : entry.startTime}:00+08:00`);
    const endDate = new Date(`${entry.end}T${["TBA", "00:00"].includes(entry.endTime) ? "23:59:59" : entry.endTime + ":00"}+08:00`);
    await insertOnly(Event, { title: entry.title, organizer: organizer._id, startDate }, {
      title: entry.title, description: entry.description, organizer: organizer._id, venue: venue._id,
      categories: categories.map((category) => category._id), startDate, endDate,
      startTime: entry.startTime, endTime: entry.endTime, posterUrl: `/event-gallery/${entry.poster}`,
      status: "published", isFeatured: true, publishedAt: new Date(),
    }, session);
  }
}

async function seedVendorLineups({ bootstrap = false, passwordHash } = {}) {
  const configured = process.env.DEMO_PASSWORD;
  if (configured && (configured.length < 8 || Buffer.byteLength(configured) > 72))
    throw new Error("DEMO_PASSWORD must contain at least 8 characters and at most 72 bytes.");
  // A generated password is never logged or written to disk. Reruns never reset accounts.
  passwordHash ||= await bcrypt.hash(configured || randomBytes(32).toString("hex"), 12);
  await Promise.all([User.init(), Organizer.init(), Venue.init(), Category.init(), Event.init(), VendorCall.init(), Application.init()]);
  const session = await mongoose.startSession();
  let report;
  try {
    await session.withTransaction(async () => {
      report = { usersAdded: 0, callsAdded: 0, applicationsAdded: 0, events: [] };
      if (bootstrap) await createPosterEvents(passwordHash, session);
      const events = await Event.find().populate("organizer", "name").populate("venue", "name").session(session);
      const plans = [];
      for (const spec of lineups) {
        const titles = [spec.title, ...spec.aliases].map(normalize);
        const matches = events.filter((event) => titles.includes(normalize(event.title)) &&
          normalize(event.organizer?.name || "") === normalize(spec.organizer) &&
          normalize(event.venue?.name || "") === normalize(spec.venue));
        if (matches.length !== 1)
          throw new Error(`Expected one matching ${spec.title} at ${spec.venue}; found ${matches.length}. No lineup changes saved.`);
        const keys = [...spec.accepted, ...spec.pending, ...spec.rejected];
        if (new Set(keys).size !== keys.length || keys.some((key) => !vendors.some((vendor) => vendor.key === key)))
          throw new Error(`Invalid or duplicate fixture vendor in ${spec.title}`);
        if (spec.totalSlots < spec.accepted.length) throw new Error(`Insufficient fixture capacity: ${spec.title}`);
        const event = matches[0];
        const calls = await VendorCall.find({ event: event._id }).session(session);
        if (calls.length > 1) throw new Error(`Multiple recruitment calls for ${spec.title}; choose the intended call before seeding.`);
        plans.push({ spec, event, call: calls[0] });
      }

      const users = new Map(), categories = new Map();
      for (const vendor of vendors) {
        let user = await User.findOne({ email: vendor.email }).session(session);
        if (!user) {
          user = await insertOnly(User, { email: vendor.email }, {
            name: vendor.businessName, email: vendor.email, passwordHash, city: "Pampanga",
          }, session);
          report.usersAdded++;
        }
        users.set(vendor.key, user);
        if (!categories.has(vendor.category)) categories.set(vendor.category,
          await insertOnly(Category, { name: vendor.category }, {
            name: vendor.category, description: "Business category for local market applications.",
          }, session));
      }

      for (const { spec, event, call: existingCall } of plans) {
        const entries = ["accepted", "pending", "rejected"].flatMap((status) =>
          spec[status].map((key) => ({ ...vendors.find((vendor) => vendor.key === key), status })));
        const categoryIds = [...new Set(entries.map((vendor) => String(categories.get(vendor.category)._id)))];
        const opening = new Date(event.startDate.getTime() - 28 * day);
        const deadline = new Date(event.startDate.getTime() - 2 * day);
        let call = existingCall;
        if (!call) {
          call = await insertOnly(VendorCall, { event: event._id }, {
            event: event._id, title: `Local brands wanted: ${event.title}`,
            description: "Bring your food, drinks or creative work to the market. Share your products, meet local shoppers and join a welcoming community of small businesses.",
            applicationStartDate: opening, applicationDeadline: deadline, totalSlots: spec.totalSlots,
            boothFee: 1000, boothSize: "2m x 2m", requirements: ["Business details", "Product list", "Booth setup plan"],
            acceptedCategories: categoryIds, status: "open", isActive: true,
          }, session);
          report.callsAdded++;
        }
        const additions = [];
        for (const vendor of entries) {
          const user = users.get(vendor.key);
          const existing = await Application.findOne({ user: user._id, event: event._id }).session(session);
          if (existing) continue; // Preserve later organizer decisions and edited applications.
          if (!call.acceptedCategories.some((id) => String(id) === String(categories.get(vendor.category)._id)))
            throw new Error(`Existing call does not accept ${vendor.category} for ${spec.title}. Review its categories first.`);
          additions.push({
            user: user._id, event: event._id, vendorCall: call._id,
            applicationCode: `POP-DEMO-${spec.key}-${vendor.key}`.toUpperCase(),
            businessName: vendor.businessName, representativeName: `${vendor.businessName} Team`,
            email: vendor.email, contactNumber: "00000000000", category: categories.get(vendor.category)._id,
            products: vendor.products, businessDescription: vendor.description, socialMedia: "", notes: demoNote,
            status: vendor.status, organizerRemarks: vendor.status === "pending" ? "" :
              vendor.status === "accepted" ? "Accepted for the school-project market lineup." : "Not selected for this demonstration round; welcome to apply to a future market.",
            reviewedAt: vendor.status === "pending" ? null : new Date(Math.min(Date.now(), deadline.getTime())),
            createdAt: opening, updatedAt: new Date(),
          });
        }
        const occupied = await Application.countDocuments({ vendorCall: call._id, status: { $in: ["accepted", "approved"] } }).session(session);
        if (occupied + additions.filter((app) => app.status === "accepted").length > call.totalSlots)
          throw new Error(`Existing capacity is too small for ${spec.title}. No existing capacity or decisions were changed.`);
        if (additions.length) await Application.insertMany(additions, { session });
        report.applicationsAdded += additions.length;
        const apps = await Application.find({ event: event._id }).select("businessName status user").session(session).lean();
        const accepted = apps.filter((app) => ["accepted", "approved"].includes(app.status));
        report.events.push({ eventId: String(event._id), title: event.title, totalSlots: call.totalSlots,
          accepted: accepted.map((app) => app.businessName),
          pending: apps.filter((app) => app.status === "pending").map((app) => app.businessName),
          rejected: apps.filter((app) => app.status === "rejected").map((app) => app.businessName),
          remainingSlots: call.totalSlots - accepted.length });
      }
    });
  } finally { await session.endSession(); }
  console.log(JSON.stringify(report, null, 2));
  return report;
}
module.exports = { seedVendorLineups };
