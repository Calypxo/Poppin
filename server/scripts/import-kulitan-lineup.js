// Add one published update to the existing Kulitan Youthfest event. No reseeding.
const fs = require("node:fs/promises");
const path = require("node:path");
const { createHash } = require("node:crypto");
const dns = require("node:dns");
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });
const mongoose = require("mongoose");
const Organizer = require("../models/Organizer");
const Event = require("../models/Event");
const Post = require("../models/Announcement");
const cloudinary = require("../config/cloudinary");
const manifest = require("../data/kulitan-lineup-update.json");
const assetRoot = path.resolve(__dirname, "../../client/public/event-gallery/kulitan-lineup");
const cachePath = path.join(__dirname, ".kulitan-lineup-upload-cache.json");
const localDate = (date) => new Date(new Date(date).valueOf() + 8 * 3600000).toISOString().slice(0, 10);

// Match the application's DNS configuration for the configured MongoDB SRV host.
dns.setServers(["8.8.8.8", "8.8.4.4"]);

function upload(bytes) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "poppin/post-updates/kulitan-youthfest", resource_type: "image" },
      (error, result) => {
        if (error || !result?.secure_url) reject(new Error("Could not upload the lineup image. Check Cloudinary configuration and rerun."));
        else resolve(result.secure_url);
      },
    );
    stream.end(bytes);
  });
}

async function main() {
  if (!process.env.MONGO_URI) throw new Error("Configure MONGO_URI in server/.env before importing.");
  const assets = await Promise.all(manifest.images.map(async ({ file }) => {
    const filePath = path.resolve(assetRoot, file);
    if (path.dirname(filePath) !== assetRoot) throw new Error("Invalid lineup asset path.");
    const bytes = await fs.readFile(filePath);
    if (bytes.length > 5 * 1024 * 1024) throw new Error(`Lineup image exceeds 5 MB: ${file}`);
    return { file, bytes, hash: createHash("sha256").update(bytes).digest("hex") };
  }));
  if (!assets.length || assets.length > 12) throw new Error("Use between 1 and 12 lineup images.");
  try { await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 }); }
  catch { throw new Error("Cannot resolve or connect to the configured MongoDB database."); }
  try {
    const organizers = await Organizer.find({ name: manifest.organizer, isActive: true }).select("_id");
    const events = await Event.find({ title: manifest.eventTitle, organizer: { $in: organizers.map(({ _id }) => _id) } });
    const matches = events.filter(event => event.status === "published" && localDate(event.startDate) === manifest.eventStart && localDate(event.endDate) === manifest.eventEnd);
    if (matches.length !== 1) throw new Error(`Expected one published Kulitan Youthfest event; found ${matches.length}. No records were changed.`);
    const event = matches[0];
    const filter = { event: event._id, title: manifest.title, type: manifest.type };
    const existing = await Post.findOne(filter);
    if (existing) {
      if (existing.content !== manifest.content || existing.imageUrls.length !== assets.length || !existing.isPublished)
        throw new Error("A different update already uses this title. No existing update was changed.");
      console.log(`Already imported: ${manifest.title} (${existing.imageUrls.length} images).`);
      return;
    }
    if (!["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"].every(name => process.env[name]))
      throw new Error("Configure Cloudinary in server/.env before importing the images.");
    let cache = {};
    try { cache = JSON.parse(await fs.readFile(cachePath, "utf8")); }
    catch (error) { if (error.code !== "ENOENT") throw new Error("Could not read the local lineup upload receipts."); }
    const imageUrls = [];
    for (const asset of assets) {
      const key = `${process.env.CLOUDINARY_CLOUD_NAME}:${asset.hash}`;
      if (!cache[key]) {
        cache[key] = await upload(asset.bytes);
        await fs.writeFile(cachePath, JSON.stringify(cache, null, 2) + "\n");
        console.log(`Uploaded ${imageUrls.length + 1}/${assets.length}: ${asset.file}`);
      }
      if (!/^https:\/\/res\.cloudinary\.com\//.test(cache[key])) throw new Error("Invalid image URL in the local upload receipts.");
      imageUrls.push(cache[key]);
    }
    const _id = new mongoose.Types.ObjectId(createHash("sha256").update(`${event._id}:${manifest.title}`).digest("hex").slice(0, 24));
    let post;
    try {
      post = await Post.create({ _id, ...filter, content: manifest.content, imageUrls, imageUrl: imageUrls[0], isPublished: true, publishedAt: new Date() });
    } catch (error) {
      if (error.code !== 11000) throw error;
      post = await Post.findOne(filter);
      if (!post || post.content !== manifest.content || post.imageUrls.length !== imageUrls.length)
        throw new Error("The lineup update changed during import. No existing update was replaced.");
    }
    console.log(`Published: ${post.title} (${post.imageUrls.length} images) for ${event.title}.`);
  } finally { await mongoose.disconnect(); }
}
main().catch(error => {
  // Never print database connection strings or credential-bearing service responses.
  console.error(error.name === "MongoServerSelectionError" ? "Cannot connect to the configured MongoDB database." : error.message);
  process.exitCode = 1;
});
