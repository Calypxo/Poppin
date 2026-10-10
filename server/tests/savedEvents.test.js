const { test, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server");
const SavedEvent = require("../models/SavedEvent");
const { seedSavedEventsData, ids } = require("./fixtures/savedEventsData");

let mongo, server, baseUrl, data;
function token(user) {
  return jwt.sign({}, process.env.JWT_SECRET, {
    subject: String(user._id), issuer: "poppin", audience: "poppin-web", expiresIn: "1h",
  });
}
async function request(method, path = "", user, body) {
  const response = await fetch(baseUrl + path, {
    method,
    headers: { ...(user ? { Authorization: "Bearer " + token(user) } : {}), "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, data: await response.json() };
}

before(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.JWT_SECRET = "saved-events-isolated-api-test-secret";
  await mongoose.connect(mongo.getUri("poppin_saved_events_api_test"));
  data = await seedSavedEventsData();
  const app = express();
  app.use(express.json());
  app.use("/saved-events", require("../routes/savedEvents"));
  app.use("/events", require("../routes/events"));
  app.use(require("../middleware/errorHandler"));
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
beforeEach(async () => { await SavedEvent.deleteMany({}); });
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test("all saved-event operations require a valid logged-in account", async () => {
  for (const [method, path] of [["GET", ""], ["PUT", "/" + ids.upcoming], ["DELETE", "/" + ids.upcoming]]) {
    assert.equal((await request(method, "/saved-events" + path)).status, 401);
  }
});

test("saves are persistent, populated and idempotent, with ownership from authentication", async () => {
  assert.deepEqual((await request("GET", "/saved-events", data.viewer)).data, []);
  assert.equal((await request("PUT", "/saved-events/" + ids.upcoming, data.viewer, { user: data.other._id })).status, 201);
  const first = (await request("GET", "/saved-events", data.viewer)).data;
  assert.equal(first[0].event.title, "Future community market");
  assert.equal(first[0].event.venue.city, "Angeles");
  assert.equal(first[0].event.eventState, "upcoming");
  assert.equal((await request("PUT", "/saved-events/" + ids.upcoming, data.viewer)).status, 200);
  await mongoose.disconnect();
  await mongoose.connect(mongo.getUri("poppin_saved_events_api_test"));
  const restored = (await request("GET", "/saved-events", data.viewer)).data;
  assert.equal(restored.length, 1);
  assert.equal(restored[0].savedAt, first[0].savedAt);
  assert.equal(await SavedEvent.countDocuments({ user: data.viewer._id, event: ids.upcoming }), 1);
});

test("concurrent saves produce exactly one MongoDB record", async () => {
  const responses = await Promise.all(Array.from({ length: 12 }, () => request("PUT", "/saved-events/" + ids.upcoming, data.viewer)));
  assert.ok(responses.every((response) => [200, 201].includes(response.status)));
  assert.equal(responses.filter((response) => response.status === 201).length, 1);
  assert.equal(await SavedEvent.countDocuments(), 1);
});

test("accounts cannot see or remove another account's saves", async () => {
  await request("PUT", "/saved-events/" + ids.upcoming, data.viewer);
  assert.deepEqual((await request("GET", "/saved-events", data.other)).data, []);
  await request("DELETE", "/saved-events/" + ids.upcoming, data.other);
  assert.equal(await SavedEvent.countDocuments({ user: data.viewer._id }), 1);
  await request("PUT", "/saved-events/" + ids.upcoming, data.other);
  assert.equal(await SavedEvent.countDocuments(), 2);
});

test("invalid IDs, missing events, private drafts and new cancelled saves are rejected", async () => {
  assert.equal((await request("PUT", "/saved-events/not-an-id", data.viewer)).status, 400);
  assert.equal((await request("DELETE", "/saved-events/not-an-id", data.viewer)).status, 400);
  for (const id of [ids.deleted, ids.draft, ids.cancelled])
    assert.equal((await request("PUT", "/saved-events/" + id, data.viewer)).status, 404);
  assert.equal(await SavedEvent.countDocuments(), 0);
});

test("saved completed and cancelled events retain their current status", async () => {
  await request("PUT", "/saved-events/" + ids.completed, data.viewer);
  await SavedEvent.create({ user: data.viewer._id, event: ids.cancelled });
  const saved = (await request("GET", "/saved-events", data.viewer)).data;
  assert.equal(saved.find((item) => item.eventId === ids.completed).event.eventState, "completed");
  assert.equal(saved.find((item) => item.eventId === ids.cancelled).event.status, "cancelled");
  assert.equal((await request("GET", "/events/" + ids.cancelled, data.viewer)).status, 200);
  assert.equal((await request("GET", "/events/" + ids.cancelled, data.other)).status, 403);
  await request("DELETE", "/saved-events/" + ids.cancelled, data.viewer);
  assert.equal((await request("GET", "/events/" + ids.cancelled, data.viewer)).status, 403);
});

test("unavailable events remain removable without leaking private draft content", async () => {
  await SavedEvent.create([
    { user: data.viewer._id, event: ids.deleted },
    { user: data.viewer._id, event: ids.draft },
  ]);
  const saved = (await request("GET", "/saved-events", data.viewer)).data;
  assert.equal(saved.length, 2);
  assert.ok(saved.every((item) => item.event === null));
  for (const item of saved) assert.equal((await request("DELETE", "/saved-events/" + item.eventId, data.viewer)).status, 200);
  assert.equal(await SavedEvent.countDocuments(), 0);
});

test("removing an event twice succeeds and leaves the saved list empty", async () => {
  await request("PUT", "/saved-events/" + ids.upcoming, data.viewer);
  for (let attempt = 0; attempt < 2; attempt++)
    assert.equal((await request("DELETE", "/saved-events/" + ids.upcoming, data.viewer)).status, 200);
  assert.deepEqual((await request("GET", "/saved-events", data.viewer)).data, []);
});
