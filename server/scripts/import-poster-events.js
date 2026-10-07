// Additive demo import: never delete existing records or run the destructive seed.
// Run with Node 22+: node server/scripts/import-poster-events.js
// Reuses organizer names, venue names, and event title/organizer/start date.
const fs = require("node:fs/promises");
const path = require("node:path");
const { createHash } = require("node:crypto");

const api = process.env.POSTER_IMPORT_API || "http://localhost:3000/api";
const root = path.resolve(__dirname, "../..");
const cachePath = path.join(__dirname, ".poster-upload-cache.json");

async function request(route, options) {
  const response = await fetch(`${api}${route}`, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: "Bearer " + process.env.POSTER_IMPORT_TOKEN,
    },
    signal: AbortSignal.timeout(60000),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(`${route}: ${data.message || response.status}`);
  return data;
}
const json = (method, body) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const normalize = (value) => value.trim().toLowerCase();

async function main() {
  if (!process.env.POSTER_IMPORT_TOKEN)
    throw new Error(
      "Set POSTER_IMPORT_TOKEN to the organizer profile owner's current token before importing",
    );
  const account = await request("/auth/me");
  if (!account.organizerId)
    throw new Error("Create an organizer profile before importing events");
  const manifest = JSON.parse(
    await fs.readFile(
      path.join(__dirname, "../data/poster-events.json"),
      "utf8",
    ),
  );
  const [organizers, venues, categories, events] = await Promise.all([
    request("/organizers"),
    request("/venues"),
    request("/categories"),
    request("/events/mine"),
  ]);
  const counts = { organizers: 0, venues: 0, events: 0, uploads: 0 };
  // Validate assets and category names before the first mutation.
  const assets = new Map();
  for (const entry of manifest.events) {
    for (const name of entry.categories) {
      if (!categories.some((category) => category.name === name))
        throw new Error(`Missing category: ${name}`);
    }
    if (!assets.has(entry.poster))
      assets.set(
        entry.poster,
        await fs.readFile(
          path.join(root, "client/public/event-gallery", entry.poster),
        ),
      );
  }
  let cache = {};
  try {
    cache = JSON.parse(await fs.readFile(cachePath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const owner = organizers.find((item) => item._id === account.organizerId);
  if (!owner || owner.user !== account._id)
    throw new Error("Your linked organizer profile was not found");
  const ownedEntries = manifest.events.filter(
    (entry) => normalize(entry.organizer) === normalize(owner.name),
  );
  if (!ownedEntries.length)
    throw new Error("No manifest entries match your organizer profile name");
  for (const entry of manifest.venues) {
    if (
      !venues.some((item) => normalize(item.name) === normalize(entry.name))
    ) {
      const venue = await request(
        "/venues",
        json("POST", {
          ...entry,
          description:
            "Venue label from the supplied event poster; confirm the full address before real use.",
        }),
      );
      venues.push(venue);
      counts.venues++;
    }
  }
  for (const entry of ownedEntries) {
    const organizer = organizers.find(
      (item) => normalize(item.name) === normalize(entry.organizer),
    );
    const venue = venues.find(
      (item) => normalize(item.name) === normalize(entry.venue),
    );
    if (!organizer || !venue)
      throw new Error(`Missing organizer or venue for ${entry.title}`);
    const startDate = new Date(
      `${entry.start}T${entry.startTime === "TBA" ? "00:00" : entry.startTime}:00+08:00`,
    ).toISOString();
    const endDate = new Date(
      `${entry.end}T${["TBA", "00:00"].includes(entry.endTime) ? "23:59:59" : entry.endTime + ":00"}+08:00`,
    ).toISOString();
    let event = events.find(
      (item) =>
        normalize(item.title) === normalize(entry.title) &&
        (item.organizer?._id || item.organizer) === organizer._id &&
        new Date(item.startDate).toISOString() === startDate,
    );
    if (!event) {
      const bytes = assets.get(entry.poster);
      const assetKey = `${api}:${createHash("sha256").update(bytes).digest("hex")}`;
      if (!cache[assetKey]) {
        const form = new FormData();
        form.append(
          "image",
          new Blob([bytes], { type: "image/jpeg" }),
          entry.poster,
        );
        const uploaded = await request("/uploads/image", {
          method: "POST",
          body: form,
        });
        if (!uploaded.secureUrl)
          throw new Error(`Upload returned no URL for ${entry.poster}`);
        cache[assetKey] = uploaded.secureUrl;
        await fs.writeFile(cachePath, JSON.stringify(cache, null, 2) + "\n");
        counts.uploads++;
      }
      event = await request(
        "/events",
        json("POST", {
          title: entry.title,
          description: entry.description,
          organizer: organizer._id,
          venue: venue._id,
          categories: entry.categories.map(
            (name) => categories.find((item) => item.name === name)._id,
          ),
          startDate,
          endDate,
          startTime: entry.startTime,
          endTime: entry.endTime,
          posterUrl: cache[assetKey],
          isFeatured: entry.start >= "2026-10-09",
        }),
      );
      events.push(event);
      counts.events++;
    }
    // Direct publishing by this event?s authenticated owner.
    if (event.status === "draft") {
      const published = await request(
        `/events/${event._id}/status`,
        json("PATCH", { status: "published" }),
      );
      Object.assign(event, published.event);
    }
    console.log(`${event.status}: ${entry.title}`);
  }
  console.log("Created:", JSON.stringify(counts));
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
