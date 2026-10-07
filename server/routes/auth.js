const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Organizer = require("../models/Organizer");
const VendorProfile = require("../models/VendorProfile");
const { requireAuth } = require("../middleware/auth");
const { fail, emailPattern } = require("../utils/access");
const router = express.Router();
async function userDto(user) {
  const [organizer, vendor] = await Promise.all([
    Organizer.findOne({ user: user._id }).select("_id"),
    VendorProfile.findOne({ user: user._id }).select("_id"),
  ]);
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    city: user.city,
    contactNumber: user.contactNumber,
    organizerId: organizer?._id || null,
    vendorId: vendor?._id || null,
  };
}
async function sessionResponse(user) {
  const token = jwt.sign({}, process.env.JWT_SECRET, {
    subject: String(user._id),
    expiresIn: "7d",
    algorithm: "HS256",
    issuer: "poppin",
    audience: "poppin-web",
  });
  return { token, user: await userDto(user) };
}
router.post("/register", async (req, res) => {
  if (!process.env.JWT_SECRET) fail(503, "Account sign-in is not configured");
  const { name, password } = req.body;
  const email =
    typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    name.length > 100 ||
    !emailPattern.test(email) ||
    email.length > 254 ||
    typeof password !== "string" ||
    password.length < 8 ||
    Buffer.byteLength(password) > 72
  )
    fail(400, "Provide a name, valid email and password of 8–72 bytes");
  if (await User.exists({ email }))
    fail(409, "An account with this email already exists");
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name: name.trim(), email, passwordHash });
  res.status(201).json(await sessionResponse(user));
});
router.post("/login", async (req, res) => {
  if (!process.env.JWT_SECRET) fail(503, "Account sign-in is not configured");
  const email =
    typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  const password = req.body.password;
  const user = await User.findOne({ email }).select("+passwordHash");
  if (
    typeof password !== "string" ||
    Buffer.byteLength(password) > 72 ||
    !user?.isActive ||
    !(await bcrypt.compare(password, user.passwordHash))
  )
    fail(401, "Email or password is incorrect");
  res.json(await sessionResponse(user));
});
router.get("/me", requireAuth, async (req, res) =>
  res.json(await userDto(req.user)),
);
module.exports = { router, userDto };
