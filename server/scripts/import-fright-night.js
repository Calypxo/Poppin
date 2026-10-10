// Add The Lokal Hype, Fright Night and its two updates without reseeding.
// node server/scripts/import-fright-night.js [--dry-run]
const fs = require("node:fs/promises");
const path = require("node:path");
const { createHash } = require("node:crypto");
const mongoose = require("mongoose");
const Organizer = require("../models/Organizer");
const Venue = require("../models/Venue");
const Category = require("../models/Category");
const Event = require("../models/Event");
const Post = require("../models/Announcement");
const catalog = require("../data/poster-events.json");
const updates = require("../data/fright-night-updates.json");
const entry = catalog.events.find(e => e.title === updates.eventTitle && e.organizer === updates.organizer);
const organizerData = catalog.organizers.find(o => o.name === updates.organizer);
const assetRoot = path.resolve(__dirname, "../../client/public/event-gallery");
const cacheFile = path.join(__dirname, ".fright-night-upload-cache.json");
const stableId = (key) => new mongoose.Types.ObjectId(createHash("sha256").update(`fright-night:${key}`).digest("hex").slice(0, 24));
const startDate = new Date(`${entry.start}T${entry.startTime}:00+08:00`);
const endDate = new Date(`${entry.end}T${entry.endTime}:00+08:00`);

async function plan(session = null) {
  const organizers = await Organizer.find({ $or: [{ name: organizerData.name }, { email: organizerData.email }] }).session(session);
  if (organizers.length > 1 || (organizers[0] && (!organizers[0].isActive || organizers[0].name !== organizerData.name)))
    throw new Error("Conflicting organizer profile. No existing records were changed.");
  const organizer = organizers[0];
  const organizerId = organizer?._id || stableId("organizer");
  const venues = await Venue.find({ name: entry.venue, city: organizerData.city, isActive: true }).session(session);
  if (venues.length !== 1) throw new Error("Expected one active Nepo Quad venue in Angeles City.");
  const venue = venues[0];
  const categories = await Category.find({ name: { $in: entry.categories }, isActive: true }).session(session);
  if (entry.categories.some(name => categories.filter(c => c.name === name).length !== 1))
    throw new Error("Required event categories are missing or ambiguous.");
  const events = await Event.find({ organizer: organizerId, title: entry.title }).session(session);
  if (events.length > 1) throw new Error("Multiple Fright Night events found; no existing records were changed.");
  const event = events[0];
  if (event && (event.status !== "published" || String(event.venue) !== String(venue._id)
    || event.startDate.valueOf() !== startDate.valueOf() || event.endDate.valueOf() !== endDate.valueOf()
    || event.startTime !== entry.startTime || event.endTime !== entry.endTime || event.description !== entry.description))
    throw new Error("Fright Night already exists with different details. No existing event was changed.");
  const eventId = event?._id || stableId("event:2026-10-02");
  const posts = [];
  for (const update of updates.posts) {
    const matches = await Post.find({ event: eventId, title: update.title }).session(session);
    const post = matches[0];
    if (matches.length > 1 || (post && (post.type !== update.type || post.content !== update.content
      || !post.isPublished || post.imageUrls.length !== update.images.length)))
      throw new Error(`An update differs from the supplied content: ${update.title}. No existing post was changed.`);
    posts.push(post);
  }
  return { organizer, organizerId, venue, categories, event, eventId, posts };
}

async function loadAssets() {
  const assets = new Map();
  for (const file of [entry.poster, ...updates.posts.flatMap(post => post.images)]) {
    const filePath = path.resolve(assetRoot, file);
    const relative = path.relative(assetRoot, filePath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Invalid event asset path.");
    const bytes = await fs.readFile(filePath);
    if (bytes.length < 2 || bytes.length > 5 * 1024 * 1024 || bytes.readUInt16BE(0) !== 0xffd8)
      throw new Error(`Expected a JPEG of at most 5 MB: ${file}`);
    assets.set(file, { bytes, hash: createHash("sha256").update(bytes).digest("hex") });
  }
  for (const post of updates.posts) {
    const hashes = post.images.map(file => assets.get(file).hash);
    if (!hashes.length || hashes.length > 12 || new Set(hashes).size !== hashes.length)
      throw new Error(`Use 1–12 different images for ${post.title}.`);
  }
  return assets;
}

async function uploadAssets(assets) {
  if (!["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"].every(name => process.env[name]))
    throw new Error("Configure Cloudinary in server/.env before importing.");
  const cloudinary = require("../config/cloudinary");
  let cache = {};
  try { cache = JSON.parse(await fs.readFile(cacheFile, "utf8")); }
  catch (error) { if (error.code !== "ENOENT") throw new Error("Could not read local upload receipts."); }
  const urls = new Map();
  for (const [file, asset] of assets) {
    const key = `${process.env.CLOUDINARY_CLOUD_NAME}:${asset.hash}`;
    if (!cache[key]) {
      cache[key] = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "poppin/events/fright-night", resource_type: "image" },
          (error, result) => error || !result?.secure_url
            ? reject(new Error(`Could not upload ${file}. Check Cloudinary configuration and rerun.`))
            : resolve(result.secure_url),
        );
        stream.end(asset.bytes);
      });
      await fs.writeFile(cacheFile, JSON.stringify(cache, null, 2) + "\n");
      console.log(`Uploaded ${urls.size + 1}/${assets.size}: ${file}`);
    }
    if (!/^https:\/\/res\.cloudinary\.com\//.test(cache[key])) throw new Error("Invalid upload receipt URL.");
    urls.set(file, cache[key]);
  }
  return urls;
}

async function importFrightNight({ dryRun = false, upload = uploadAssets } = {}) {
  const assets = await loadAssets();
  const initial = await plan();
  if (initial.organizer && initial.event && initial.posts.every(Boolean)) {
    console.log("Already imported: The Lokal Hype, Fright Night, merchant lineup and five Day 1 photos.");
    return;
  }
  if (dryRun) {
    console.log(`Ready: ${organizerData.name}, ${entry.title}, October 2–4, 2026, 15:00–22:00 (Asia/Manila), ${updates.posts.length} updates, ${assets.size} images. No changes made.`);
    return;
  }
  const urls = await upload(assets);
  for (const file of assets.keys()) {
    if (!/^https:\/\/res\.cloudinary\.com\//.test(urls.get(file) || "")) throw new Error(`Missing uploaded image: ${file}`);
  }
  // All database additions succeed together; an existing record is never replaced.
  await mongoose.connection.transaction(async (session) => {
    const current = await plan(session);
    if (!current.organizer) await Organizer.create([{ _id: current.organizerId, ...organizerData }], { session });
    if (!current.event) await Event.create([{
      _id: current.eventId, title: entry.title, description: entry.description,
      organizer: current.organizerId, venue: current.venue._id,
      categories: entry.categories.map(name => current.categories.find(c => c.name === name)._id),
      startDate, endDate, startTime: entry.startTime, endTime: entry.endTime,
      posterUrl: urls.get(entry.poster), status: "published", publishedAt: new Date(),
    }], { session });
    for (const [index, update] of updates.posts.entries()) {
      if (current.posts[index]) continue;
      const imageUrls = update.images.map(file => urls.get(file));
      await Post.create([{
        _id: stableId(`${current.eventId}:${update.title}`), event: current.eventId,
        title: update.title, content: update.content, type: update.type,
        imageUrls, imageUrl: imageUrls[0], isPublished: true, publishedAt: new Date(),
      }], { session });
    }
  });
  console.log("Published: The Lokal Hype / Fright Night, merchant lineup (1 image), Day 1 (5 images in numbered order).");
}

if (require.main === module) {
  require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });
  require("node:dns").setServers(["8.8.8.8", "8.8.4.4"]);
  (async () => {
    try {
      if (process.argv.slice(2).some(arg => arg !== "--dry-run")) throw new Error("Usage: node server/scripts/import-fright-night.js [--dry-run]");
      if (!process.env.MONGO_URI) throw new Error("Configure MONGO_URI in server/.env before importing.");
      try { await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 }); }
      catch { throw new Error("Cannot connect to the configured MongoDB database."); }
      await importFrightNight({ dryRun: process.argv.includes("--dry-run") });
    } catch (error) {
      // Keep credential-bearing database and upload error details out of logs.
      console.error(error.name?.startsWith("Mongo") ? "Database import failed. No existing records were replaced; rerun to retry." : error.message);
      process.exitCode = 1;
    } finally { await mongoose.disconnect(); }
  })();
}

module.exports = { importFrightNight };
