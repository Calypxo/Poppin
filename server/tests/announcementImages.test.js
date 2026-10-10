const { test, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Post = require("../models/Announcement");
const { seedSavedEventsData } = require("./fixtures/savedEventsData");

let mongo, server, baseUrl, data;
const image = (name) => `https://res.cloudinary.com/poppin/image/upload/${name}.jpg`;
const images = [image("merchant-one"), image("merchant-two"), image("merchant-three")];
const postBody = (extra = {}) => ({
  event: String(data.upcoming._id),
  title: "Meet the market merchants",
  content: "Coffee, matcha, food and local finds.",
  type: "lineup",
  ...extra,
});
function token(user) {
  return jwt.sign({}, process.env.JWT_SECRET, {
    subject: String(user._id), issuer: "poppin", audience: "poppin-web", expiresIn: "1h",
  });
}
async function request(method, path = "", user, body) {
  const response = await fetch(baseUrl + path, {
    method,
    headers: {
      ...(user ? { Authorization: "Bearer " + token(user) } : {}),
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, data: await response.json() };
}

before(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.JWT_SECRET = "announcement-images-isolated-api-test-secret";
  await mongoose.connect(mongo.getUri("poppin_announcement_images_api_test"));
  data = await seedSavedEventsData();
  const app = express();
  app.use(express.json());
  app.use("/posts", require("../routes/announcements"));
  app.use(require("../middleware/errorHandler"));
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/posts`;
});
beforeEach(async () => { await Post.deleteMany({}); });
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test("creates and reads ordered multi-image posts with a compatible cover image", async () => {
  const gallery = Array.from({ length: 12 }, (_, index) => image(`merchant-${index}`));
  const created = await request("POST", "", data.host, postBody({ imageUrls: gallery, imageUrl: images[0] }));
  assert.equal(created.status, 201);
  assert.deepEqual(created.data.imageUrls, gallery);
  assert.equal(created.data.imageUrl, gallery[0]);
  assert.ok(created.data.publishedAt);
  for (const path of ["", "/" + created.data._id, "/event/" + data.upcoming._id]) {
    const response = await request("GET", path);
    assert.equal(response.status, 200);
    const post = Array.isArray(response.data) ? response.data[0] : response.data;
    assert.deepEqual(post.imageUrls, gallery);
    assert.equal(post.imageUrl, gallery[0]);
  }
  const persisted = await Post.findById(created.data._id).lean();
  assert.deepEqual(persisted.imageUrls, gallery);
  assert.equal(persisted.imageUrl, gallery[0]);
});

test("gallery edits replace images in order and text-only edits retain the gallery", async () => {
  const created = await request("POST", "", data.host, postBody({ imageUrls: images }));
  const replacement = [images[2], images[0]];
  const edited = await request("PATCH", "/" + created.data._id, data.host, { imageUrls: replacement });
  assert.equal(edited.status, 200);
  assert.deepEqual(edited.data.imageUrls, replacement);
  assert.equal(edited.data.imageUrl, replacement[0]);
  assert.equal(edited.data.publishedAt, created.data.publishedAt);
  const textEdit = await request("PATCH", "/" + created.data._id, data.host, { content: "An updated merchant lineup." });
  assert.equal(textEdit.status, 200);
  assert.deepEqual(textEdit.data.imageUrls, replacement);
  assert.equal(textEdit.data.imageUrl, replacement[0]);
});

test("single-image clients create and replace galleries without leaving stale images", async () => {
  const created = await request("POST", "", data.host, postBody({ imageUrl: images[0] }));
  assert.equal(created.status, 201);
  assert.deepEqual(created.data.imageUrls, [images[0]]);
  await request("PATCH", "/" + created.data._id, data.host, { imageUrls: images });
  const edited = await request("PATCH", "/" + created.data._id, data.host, { imageUrl: images[2] });
  assert.equal(edited.status, 200);
  assert.equal(edited.data.imageUrl, images[2]);
  assert.deepEqual(edited.data.imageUrls, [images[2]]);
  assert.deepEqual((await Post.findById(created.data._id).lean()).imageUrls, [images[2]]);
});

test("legacy stored posts remain readable and gain a gallery when their image changes", async () => {
  const legacy = await Post.collection.insertOne({
    ...postBody(), event: data.upcoming._id, imageUrl: images[0],
    isPublished: true, publishedAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
  });
  const read = await request("GET", "/" + legacy.insertedId);
  assert.equal(read.status, 200);
  assert.equal(read.data.imageUrl, images[0]);
  const edited = await request("PATCH", "/" + legacy.insertedId, data.host, { imageUrl: images[1] });
  assert.equal(edited.status, 200);
  assert.deepEqual(edited.data.imageUrls, [images[1]]);
});

test("an empty gallery or a legacy empty image clears both image fields", async () => {
  const created = await request("POST", "", data.host, postBody({ imageUrls: images }));
  const clearGallery = await request("PATCH", "/" + created.data._id, data.host, { imageUrls: [], imageUrl: images[0] });
  assert.equal(clearGallery.status, 200);
  assert.deepEqual(clearGallery.data.imageUrls, []);
  assert.equal(clearGallery.data.imageUrl, "");
  await request("PATCH", "/" + created.data._id, data.host, { imageUrls: images });
  const clearLegacy = await request("PATCH", "/" + created.data._id, data.host, { imageUrl: "" });
  assert.equal(clearLegacy.status, 200);
  assert.deepEqual(clearLegacy.data.imageUrls, []);
  assert.equal(clearLegacy.data.imageUrl, "");
  const withoutImages = await request("POST", "", data.host, postBody());
  assert.equal(withoutImages.status, 201);
  assert.deepEqual(withoutImages.data.imageUrls, []);
  assert.equal(withoutImages.data.imageUrl, "");
});

test("invalid gallery types, entries, duplicates and image limits fail without writes", async () => {
  const created = await request("POST", "", data.host, postBody({ imageUrls: images }));
  const before = await Post.findById(created.data._id).lean();
  const invalidGalleries = [
    null, images[0], { 0: images[0] }, [null], [12], [{}], [""],
    [images[0], "https://example.com/not-uploaded.jpg"],
    [images[0], "/event-gallery/local.jpg"],
    [images[0], images[0]],
    Array.from({ length: 13 }, (_, index) => image(`merchant-${index}`)),
  ];
  for (const imageUrls of invalidGalleries) {
    const createdInvalid = await request("POST", "", data.host, postBody({ imageUrls }));
    assert.equal(createdInvalid.status, 400, JSON.stringify(imageUrls));
    assert.ok(createdInvalid.data.message);
    const editedInvalid = await request("PATCH", "/" + created.data._id, data.host, { imageUrls, title: "Must not be saved" });
    assert.equal(editedInvalid.status, 400, JSON.stringify(imageUrls));
    assert.deepEqual(await Post.findById(created.data._id).lean(), before);
  }
  assert.equal(await Post.countDocuments(), 1);
});

test("invalid legacy image values also fail without changing stored galleries", async () => {
  const created = await request("POST", "", data.host, postBody({ imageUrls: images }));
  const before = await Post.findById(created.data._id).lean();
  for (const imageUrl of [null, 12, {}, [], "https://example.com/image.jpg", "data:image/png;base64,abc"]) {
    assert.equal((await request("POST", "", data.host, postBody({ imageUrl }))).status, 400);
    assert.equal((await request("PATCH", "/" + created.data._id, data.host, { imageUrl })).status, 400);
    assert.deepEqual(await Post.findById(created.data._id).lean(), before);
  }
  assert.equal(await Post.countDocuments(), 1);
});

test("gallery writes and deletes still require authentication and event ownership", async () => {
  const created = await request("POST", "", data.host, postBody({ imageUrls: images }));
  const before = await Post.findById(created.data._id).lean();
  for (const [user, status] of [[undefined, 401], [data.viewer, 403], [data.other, 403]]) {
    assert.equal((await request("POST", "", user, postBody({ imageUrls: images }))).status, status);
    assert.equal((await request("PATCH", "/" + created.data._id, user, { imageUrls: [] })).status, status);
    assert.equal((await request("DELETE", "/" + created.data._id, user)).status, status);
  }
  assert.deepEqual(await Post.findById(created.data._id).lean(), before);
  assert.equal(await Post.countDocuments(), 1);
  const moved = await request("PATCH", "/" + created.data._id, data.host, { event: String(data.draft._id), imageUrls: [] });
  assert.equal(moved.status, 400);
  assert.deepEqual(await Post.findById(created.data._id).lean(), before);
  assert.equal((await request("DELETE", "/" + created.data._id, data.host)).status, 200);
});

test("draft-event publication rules and draft-post visibility apply to galleries", async () => {
  const body = postBody({ event: String(data.draft._id), imageUrls: images });
  assert.equal((await request("POST", "", data.host, body)).status, 400);
  assert.equal(await Post.countDocuments(), 0);
  const created = await request("POST", "", data.host, { ...body, isPublished: false });
  assert.equal(created.status, 201);
  assert.equal(created.data.publishedAt, null);
  assert.deepEqual(created.data.imageUrls, images);
  for (const user of [undefined, data.viewer])
    assert.equal((await request("GET", "/" + created.data._id, user)).status, 403);
  assert.equal((await request("GET", "/" + created.data._id, data.host)).status, 200);
  assert.deepEqual((await request("GET", "")).data, []);
  assert.equal((await request("GET", "/mine", data.host)).data.length, 1);
  const before = await Post.findById(created.data._id).lean();
  assert.equal((await request("PATCH", "/" + created.data._id, data.host, { isPublished: true, imageUrls: [images[1]] })).status, 400);
  assert.deepEqual(await Post.findById(created.data._id).lean(), before);
});

test("gallery changes preserve publishing and unpublishing behavior", async () => {
  const created = await request("POST", "", data.host, postBody({ imageUrls: images, isPublished: false }));
  assert.equal(created.status, 201);
  assert.equal(created.data.publishedAt, null);
  const published = await request("PATCH", "/" + created.data._id, data.host, { isPublished: true, imageUrls: [images[1]] });
  assert.equal(published.status, 200);
  assert.ok(published.data.publishedAt);
  assert.equal(published.data.imageUrl, images[1]);
  assert.deepEqual(published.data.imageUrls, [images[1]]);
  const unpublished = await request("PATCH", "/" + created.data._id, data.host, { isPublished: false });
  assert.equal(unpublished.status, 200);
  assert.equal(unpublished.data.publishedAt, null);
  assert.deepEqual(unpublished.data.imageUrls, [images[1]]);
  assert.deepEqual((await request("GET", "")).data, []);
});
