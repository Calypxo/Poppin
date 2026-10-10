const { test, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const Organizer = require("../models/Organizer");
const Venue = require("../models/Venue");
const Category = require("../models/Category");
const Event = require("../models/Event");
const Post = require("../models/Announcement");
const Call = require("../models/VendorCall");
const Application = require("../models/VendorApplication");
const { importFrightNight } = require("../scripts/import-fright-night");
const { importFrightNightVendors } = require("../scripts/import-fright-night-vendors");
const lineup = require("../data/fright-night-vendors.json");
const updates = require("../data/fright-night-updates.json");
const entry = require("../data/poster-events.json").events.find(e => e.title === "Fright Night");
let mongo, venue, uploadCalls;

async function upload(assets) {
  uploadCalls++;
  assert.equal(assets.size, 7);
  return new Map([...assets.keys()].map(file => [file, `https://res.cloudinary.com/test/image/upload/${file}`]));
}

before(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri("poppin_fright_night_import_test"));
  await Promise.all([Organizer, Venue, Category, Event, Post, Call, Application].map(model => model.init()));
  venue = await Venue.create({ name: "Nepo Quad", address: "Nepo Center", city: "Angeles City", venueType: "Lifestyle Center" });
  await Category.create([...new Set([...entry.categories, ...lineup.vendors.map(v => v.category)])].map(name => ({ name })));
});
beforeEach(async () => {
  await Promise.all([Post, Event, Organizer, Call, Application].map(model => model.deleteMany({})));
  uploadCalls = 0;
});
after(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test("dry run checks assets and references without uploading or adding records", async () => {
  await importFrightNight({ dryRun: true, upload });
  assert.equal(uploadCalls, 0);
  assert.equal(await Organizer.countDocuments(), 0);
  assert.equal(await Event.countDocuments(), 0);
  assert.equal(await Post.countDocuments(), 0);
});

test("imports the supplied captions and ordered photos once, reusing the existing venue", async () => {
  await importFrightNight({ upload });
  const organizer = await Organizer.findOne();
  const event = await Event.findOne();
  assert.equal(organizer.name, "The Lokal Hype");
  assert.equal(organizer.socialMedia, "https://www.facebook.com/TheLokalHype");
  assert.equal(String(event.organizer), String(organizer._id));
  assert.equal(String(event.venue), String(venue._id));
  assert.equal(event.startDate.toISOString(), "2026-10-02T07:00:00.000Z");
  assert.equal(event.endDate.toISOString(), "2026-10-04T14:00:00.000Z");
  assert.equal(event.description, entry.description);
  assert.equal(event.status, "published");
  for (const update of updates.posts) {
    const post = await Post.findOne({ event: event._id, title: update.title });
    assert.equal(post.content, update.content);
    assert.equal(post.type, update.type);
    assert.equal(post.isPublished, true);
    assert.deepEqual(post.imageUrls, update.images.map(file => `https://res.cloudinary.com/test/image/upload/${file}`));
    assert.equal(post.imageUrl, post.imageUrls[0]);
  }
  const original = await Post.find().sort({ _id: 1 }).lean();
  await importFrightNight({ upload });
  assert.equal(uploadCalls, 1);
  assert.equal(await Organizer.countDocuments(), 1);
  assert.equal(await Event.countDocuments(), 1);
  assert.equal(await Venue.countDocuments(), 1);
  assert.equal(await Post.countDocuments(), 2);
  assert.deepEqual(await Post.find().sort({ _id: 1 }).lean(), original);
});

test("reruns preserve edited posts and refuse conflicting content before uploading", async () => {
  await importFrightNight({ upload });
  await Post.updateOne({ title: updates.posts[0].title }, { $set: { content: "An organizer edited this caption." } });
  const original = await Post.find().sort({ _id: 1 }).lean();
  await assert.rejects(importFrightNight({ upload }), /differs from the supplied content/);
  assert.equal(uploadCalls, 1);
  assert.deepEqual(await Post.find().sort({ _id: 1 }).lean(), original);
});

test("invalid uploaded galleries roll back the organizer, event and both updates together", async () => {
  await assert.rejects(importFrightNight({
    upload: async assets => new Map([...assets.keys()].map(file => [file, "https://res.cloudinary.com/test/image/upload/duplicate.jpg"])),
  }), /Use up to 12 different post images/);
  assert.equal(await Organizer.countDocuments(), 0);
  assert.equal(await Event.countDocuments(), 0);
  assert.equal(await Post.countDocuments(), 0);
  assert.equal(await Venue.countDocuments(), 1);
});

test("poster merchants populate an archived lineup without opening recruitment or replacing review decisions", async () => {
  await importFrightNight({ upload });
  await importFrightNightVendors({ dryRun: true });
  assert.equal(await Application.countDocuments(), 0);
  assert.equal(await Call.countDocuments(), 0);
  await importFrightNightVendors();
  const event = await Event.findOne();
  const call = await Call.findOne();
  assert.equal(call.status, "closed");
  assert.equal(call.isActive, false);
  assert.equal(String(call.event), String(event._id));
  const applications = await Application.find().populate("category");
  assert.equal(applications.length, 8);
  assert.deepEqual(applications.map(app => app.businessName).sort(), lineup.vendors.map(v => v.businessName).sort());
  for (const vendor of lineup.vendors) {
    const app = applications.find(app => app.businessName === vendor.businessName);
    assert.equal(app.status, "accepted");
    assert.equal(app.products, vendor.products);
    assert.equal(app.category.name, vendor.category);
    assert.equal(String(app.event), String(event._id));
    assert.equal(String(app.vendorCall), String(call._id));
    assert.equal(app.user, undefined);
  }
  await Application.updateOne({ _id: applications[0]._id }, { $set: { status: "rejected", businessDescription: "Organizer edited this entry." } });
  const original = await Application.find().sort({ _id: 1 }).lean();
  await importFrightNightVendors();
  assert.equal(await Call.countDocuments(), 1);
  assert.deepEqual(await Application.find().sort({ _id: 1 }).lean(), original);
  assert.equal(await Post.countDocuments(), 2);
});

test("missing merchant categories abort before adding any lineup records", async () => {
  await importFrightNight({ upload });
  await Category.updateOne({ name: "Creative Services" }, { $set: { isActive: false } });
  try {
    await assert.rejects(importFrightNightVendors(), /category is missing/);
    assert.equal(await Application.countDocuments(), 0);
    assert.equal(await Call.countDocuments(), 0);
    assert.equal(await Event.countDocuments(), 1);
    assert.equal(await Post.countDocuments(), 2);
  } finally {
    await Category.updateOne({ name: "Creative Services" }, { $set: { isActive: true } });
  }
});
