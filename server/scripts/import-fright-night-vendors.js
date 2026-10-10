// Populate only Fright Night's public lineup from the supplied merchant poster.
// The closed, inactive call is an archive for imported entries, not recruitment.
const path = require("node:path");
const { createHash } = require("node:crypto");
const mongoose = require("mongoose");
const Organizer = require("../models/Organizer");
const Event = require("../models/Event");
const Category = require("../models/Category");
const Call = require("../models/VendorCall");
const Application = require("../models/VendorApplication");
const manifest = require("../data/fright-night-vendors.json");
const stableId = key => new mongoose.Types.ObjectId(createHash("sha256").update(`fright-night-lineup:${key}`).digest("hex").slice(0, 24));

async function plan(session = null) {
  const organizers = await Organizer.find({ name: manifest.organizer, isActive: true }).select("_id").session(session);
  const events = await Event.find({
    title: manifest.eventTitle, organizer: { $in: organizers.map(o => o._id) }, status: "published",
    startDate: new Date("2026-10-02T15:00:00+08:00"), endDate: new Date("2026-10-04T22:00:00+08:00"),
  }).session(session);
  if (events.length !== 1) throw new Error("Expected one published Fright Night event by The Lokal Hype on October 2–4, 2026.");
  const event = events[0];
  const categoryNames = [...new Set(manifest.vendors.map(vendor => vendor.category))];
  const categories = await Category.find({ name: { $in: categoryNames }, isActive: true }).session(session);
  if (categoryNames.some(name => categories.filter(category => category.name === name).length !== 1))
    throw new Error("A selected merchant category is missing or ambiguous.");
  const callId = stableId(`${event._id}:archive`);
  const call = await Call.findById(callId).session(session);
  if (call && (String(call.event) !== String(event._id) || call.status !== "closed" || call.isActive))
    throw new Error("The imported lineup archive was changed. No records were replaced.");
  const existing = await Application.find({ event: event._id }).session(session);
  const pending = [];
  for (const vendor of manifest.vendors) {
    const code = `POP-FRIGHT-${vendor.key}`.toUpperCase();
    const matched = existing.find(app => app.applicationCode === code
      || app.businessName.trim().toLowerCase() === vendor.businessName.toLowerCase());
    // Preserve any existing applications, including later review decisions.
    if (!matched) pending.push({ ...vendor, code });
  }
  if (call) {
    const accepted = await Application.countDocuments({ vendorCall: call._id, status: { $in: ["accepted", "approved"] } }).session(session);
    if (accepted + pending.length > call.totalSlots) throw new Error("The existing archive has insufficient capacity. No existing settings were changed.");
  }
  return { event, categories, call, callId, pending };
}

async function importFrightNightVendors({ dryRun = false } = {}) {
  const initial = await plan();
  if (dryRun) {
    console.log(`Ready: ${initial.pending.length} new merchants from the Fright Night poster. No records changed.`);
    return;
  }
  if (!initial.pending.length) {
    console.log("Fright Night merchants already imported; existing entries and review decisions preserved.");
    return;
  }
  await Promise.all([Call.init(), Application.init()]);
  let added = 0;
  await mongoose.connection.transaction(async session => {
    const current = await plan(session);
    added = current.pending.length;
    if (!added) return;
    if (!current.call) await Call.create([{
      _id: current.callId, event: current.event._id, title: "Fright Night poster lineup",
      description: "Archived merchant entries from the supplied Fright Night lineup poster. Recruitment is closed.",
      applicationStartDate: current.event.startDate, applicationDeadline: current.event.startDate,
      totalSlots: manifest.vendors.length, boothFee: 0, boothSize: "", requirements: [],
      acceptedCategories: current.categories.map(category => category._id), status: "closed", isActive: false,
    }], { session });
    await Application.insertMany(current.pending.map(vendor => ({
      _id: stableId(`${current.event._id}:${vendor.key}`), event: current.event._id, vendorCall: current.callId,
      applicationCode: vendor.code, businessName: vendor.businessName, representativeName: vendor.businessName,
      email: `${vendor.key}@example.invalid`, contactNumber: "Not supplied",
      category: current.categories.find(category => category.name === vendor.category)._id,
      products: vendor.products, businessDescription: vendor.description, socialMedia: "", status: "accepted",
      notes: `Imported from the user-supplied merchant poster (${manifest.source}); not an online application. Contact placeholders are private. Archive dates, fee and capacity are technical placeholders, not actual recruitment terms.`,
      organizerRemarks: "Listed on the supplied Fright Night merchant poster.", reviewedAt: null,
    })), { session });
  });
  console.log(`Added ${added} Fright Night merchants to the public vendor lineup.`);
}

if (require.main === module) {
  require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });
  require("node:dns").setServers(["8.8.8.8", "8.8.4.4"]);
  (async () => {
    try {
      if (process.argv.slice(2).some(arg => arg !== "--dry-run")) throw new Error("Usage: node server/scripts/import-fright-night-vendors.js [--dry-run]");
      if (!process.env.MONGO_URI) throw new Error("Configure MONGO_URI in server/.env before importing.");
      try { await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 }); }
      catch { throw new Error("Cannot connect to the configured MongoDB database."); }
      await importFrightNightVendors({ dryRun: process.argv.includes("--dry-run") });
    } catch (error) {
      console.error(error.name?.startsWith("Mongo") ? "Lineup import failed. No existing records were replaced; rerun to retry." : error.message);
      process.exitCode = 1;
    } finally { await mongoose.disconnect(); }
  })();
}

module.exports = { importFrightNightVendors };
