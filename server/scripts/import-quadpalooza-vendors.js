// Add the supplied poster vendors to the existing event without opening recruitment.
const path = require("node:path");
const { createHash } = require("node:crypto");
const mongoose = require("mongoose");
const Organizer = require("../models/Organizer");
const Event = require("../models/Event");
const Category = require("../models/Category");
const Call = require("../models/VendorCall");
const Application = require("../models/VendorApplication");
const { applicationEventFilter } = require("../utils/applicationAccess");
const manifest = require("../data/quadpalooza-vendors.json");
const normalize = value => value.trim().normalize("NFKC").toLowerCase();
const stableId = key => new mongoose.Types.ObjectId(
  createHash("sha256").update(`quadpalooza-lineup:${key}`).digest("hex").slice(0, 24),
);

async function plan(session = null) {
  if (manifest.vendors.length !== 10 ||
      new Set(manifest.vendors.map(v => v.key)).size !== 10 ||
      new Set(manifest.vendors.map(v => normalize(v.businessName))).size !== 10)
    throw new Error("Expected 10 distinct poster vendors.");
  const organizers = await Organizer.find({ name: manifest.organizer, isActive: true })
    .select("_id").session(session);
  const events = await Event.find({
    title: manifest.eventTitle, organizer: { $in: organizers.map(o => o._id) },
    status: "published", startDate: new Date(manifest.startDate), endDate: new Date(manifest.endDate),
  }).session(session);
  if (events.length !== 1)
    throw new Error("Expected one published QUADPALOOZA by 11.11 Market on September 25–27, 2026.");
  const event = events[0];
  const names = [...new Set(manifest.vendors.map(v => v.category))];
  const categories = await Category.find({ name: { $in: names }, isActive: true }).session(session);
  if (names.some(name => categories.filter(c => c.name === name).length !== 1))
    throw new Error("A selected vendor category is missing or ambiguous.");
  const callId = stableId(`${event._id}:archive`);
  const call = await Call.findById(callId).session(session);
  if (call && (String(call.event) !== String(event._id) || call.status !== "closed" || call.isActive))
    throw new Error("The lineup archive was changed. No existing settings were replaced.");
  const existing = await Application.find(await applicationEventFilter(event._id, session)).session(session);
  const pending = manifest.vendors.map(v => ({
    ...v, code: `POP-QUAD-${event._id}-${v.key}`.toUpperCase(),
  })).filter(v => !existing.some(app => app.applicationCode === v.code ||
    normalize(app.businessName) === normalize(v.businessName)));
  // Preserve existing applications and later organizer decisions, even if not accepted.
  if (call) {
    const occupied = await Application.countDocuments({
      vendorCall: call._id, status: { $in: ["accepted", "approved"] },
    }).session(session);
    if (occupied + pending.length > call.totalSlots)
      throw new Error("The existing archive has insufficient capacity.");
  }
  const records = pending.map(v => ({
    _id: stableId(`${event._id}:${v.key}`), event: event._id, vendorCall: callId,
    applicationCode: v.code, businessName: v.businessName, representativeName: v.businessName,
    email: `${v.key}@example.invalid`, contactNumber: "Not supplied",
    category: categories.find(c => c.name === v.category)._id,
    products: v.products, businessDescription: v.description, socialMedia: "",
    status: "accepted", reviewedAt: null,
    organizerRemarks: "Listed in the supplied Quadpalooza brand directory.",
    notes: `Poster import, not an online application. Source: ${manifest.source}; vendor feature: ${v.sourceImage}. ${v.sourceNote || ""} Contact and representative fields are private placeholders; no real contacts were supplied. Archive dates, fee and capacity are technical placeholders, not recruitment terms.`,
  }));
  for (const record of records) await new Application(record).validate();
  return { event, call, callId, categories, records };
}

async function importQuadpaloozaVendors({ dryRun = false } = {}) {
  const initial = await plan();
  if (dryRun) {
    console.log(JSON.stringify({ event: initial.event.title, eventId: initial.event._id,
      toAdd: initial.records.map(v => v.businessName), count: initial.records.length, dryRun: true }, null, 2));
    return;
  }
  if (!initial.records.length) {
    console.log("Quadpalooza vendors already present; existing records and decisions preserved.");
    return;
  }
  await Promise.all([Call.init(), Application.init()]);
  let added = 0;
  await mongoose.connection.transaction(async session => {
    const current = await plan(session);
    added = current.records.length;
    if (!added) return;
    if (!current.call) await Call.create([{
      _id: current.callId, event: current.event._id, title: "Quadpalooza poster lineup",
      description: "Imported merchant directory entries. This inactive archive does not accept applications.",
      applicationStartDate: current.event.startDate, applicationDeadline: current.event.startDate,
      totalSlots: manifest.vendors.length, boothFee: 0, boothSize: "", requirements: [],
      acceptedCategories: current.categories.map(c => c._id), status: "closed", isActive: false,
    }], { session });
    await Application.insertMany(current.records, { session });
  });
  console.log(`Added ${added} Quadpalooza vendors to the public lineup.`);
}

if (require.main === module) {
  require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });
  require("node:dns").setServers(["8.8.8.8", "8.8.4.4"]);
  (async () => {
    try {
      if (process.argv.slice(2).some(arg => arg !== "--dry-run"))
        throw new Error("Usage: node server/scripts/import-quadpalooza-vendors.js [--dry-run]");
      if (!process.env.MONGO_URI) throw new Error("Configure MONGO_URI in server/.env.");
      try { await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 }); }
      catch { throw new Error("Cannot connect to the configured MongoDB database."); }
      await importQuadpaloozaVendors({ dryRun: process.argv.includes("--dry-run") });
    } catch (error) {
      console.error(error.name?.startsWith("Mongo")
        ? "Lineup import failed. No existing records were replaced; rerun to retry."
        : error.message);
      process.exitCode = 1;
    } finally { await mongoose.disconnect(); }
  })();
}
module.exports = { importQuadpaloozaVendors };
