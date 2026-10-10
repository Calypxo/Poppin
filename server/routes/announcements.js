const express = require("express");
const Post = require("../models/Announcement");
const Event = require("../models/Event");
const { optionalAuth, requireAuth } = require("../middleware/auth");
const {
  ownedEvent,
  ownEventIds,
  readableEvent,
  fail,
  pick,
  imageUrl,
} = require("../utils/access");
const router = express.Router();
const populate = (query) =>
  query.populate({
    path: "event",
    populate: { path: "organizer", select: "name logoUrl user city" },
  });
const fields = ["title", "content", "type", "isPublished"];
function postImages(body) {
  if (Object.hasOwn(body, "imageUrls")) {
    if (!Array.isArray(body.imageUrls))
      fail(400, "Post images must be an array");
    if (body.imageUrls.length > 12)
      fail(400, "Use up to 12 post images");
    if (
      body.imageUrls.some(
        (url) => typeof url !== "string" || !url || !imageUrl(url),
      )
    )
      fail(400, "Use uploaded post images");
    if (new Set(body.imageUrls).size !== body.imageUrls.length)
      fail(400, "Each post image must be different");
    return { imageUrls: body.imageUrls, imageUrl: body.imageUrls[0] || "" };
  }
  if (Object.hasOwn(body, "imageUrl")) {
    if (typeof body.imageUrl !== "string" || !imageUrl(body.imageUrl))
      fail(400, "Use an uploaded post image");
    return {
      imageUrl: body.imageUrl,
      imageUrls: body.imageUrl ? [body.imageUrl] : [],
    };
  }
  return {};
}
router.get("/mine", requireAuth, async (req, res) =>
  res.json(
    await populate(
      Post.find({ event: { $in: await ownEventIds(req.user) } }).sort({
        createdAt: -1,
      }),
    ),
  ),
);
router.get("/", async (req, res) => {
  const events = await Event.find({ status: "published" }).select("_id");
  res.json(
    await populate(
      Post.find({
        event: { $in: events.map((e) => e._id) },
        isPublished: true,
      }).sort({ publishedAt: -1 }),
    ),
  );
});
router.get("/event/:eventId", optionalAuth, async (req, res) => {
  const event = await Event.findById(req.params.eventId);
  if (!event) fail(404, "Event not found");
  let owner = false;
  if (req.user) {
    try {
      await ownedEvent(req.user, event._id);
      owner = true;
    } catch (error) {
      if (error.status !== 403) throw error;
    }
  }
  if (event.status !== "published" && !owner)
    await readableEvent(req.user, event);
  res.json(
    await populate(
      Post.find({
        event: event._id,
        ...(owner ? {} : { isPublished: true }),
      }).sort({ publishedAt: -1, createdAt: -1 }),
    ),
  );
});
router.get("/:id", optionalAuth, async (req, res) => {
  const post = await populate(Post.findById(req.params.id));
  if (!post) fail(404, "Post not found");
  if (!post.isPublished) await ownedEvent(req.user, post.event._id);
  else if (post.event.status !== "published")
    await readableEvent(req.user, post.event);
  res.json(post);
});
async function save(req, res, creating) {
  const post = creating
    ? new Post({ event: req.body.event })
    : await Post.findById(req.params.id);
  if (!post) fail(404, "Post not found");
  const event = await ownedEvent(req.user, post.event);
  if (
    !creating &&
    req.body.event &&
    String(req.body.event) !== String(post.event)
  )
    fail(400, "A post cannot be moved to another event");
  const wasPublished = post.isPublished;
  Object.assign(post, pick(req.body, fields), postImages(req.body));
  if (post.isPublished && event.status !== "published")
    fail(400, "Publish the event before publishing updates");
  if (post.isPublished && (creating || !wasPublished))
    post.publishedAt = new Date();
  if (!post.isPublished) post.publishedAt = null;
  await post.save();
  res
    .status(creating ? 201 : 200)
    .json(await populate(Post.findById(post._id)));
}
router.post("/", requireAuth, (req, res) => save(req, res, true));
router.patch("/:id", requireAuth, (req, res) => save(req, res, false));
router.delete("/:id", requireAuth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) fail(404, "Post not found");
  await ownedEvent(req.user, post.event);
  await post.deleteOne();
  res.json({ message: "Post deleted" });
});
module.exports = router;
