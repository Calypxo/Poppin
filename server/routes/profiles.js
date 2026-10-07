const express = require("express");
const Organizer = require("../models/Organizer");
const Vendor = require("../models/VendorProfile");
const Category = require("../models/Category");
const { requireAuth } = require("../middleware/auth");
const { userDto } = require("./auth");
const { fail, pick, imageUrl, emailPattern } = require("../utils/access");
const router = express.Router();
router.use(requireAuth);

async function profiles(user) {
  const [organizer, vendor] = await Promise.all([
    Organizer.findOne({ user: user._id }),
    Vendor.findOne({ user: user._id }).populate("category"),
  ]);
  return { user: await userDto(user), organizer, vendor };
}
router.get("/me", async (req, res) => res.json(await profiles(req.user)));
router.patch("/me", async (req, res) => {
  const changes = pick(req.body, [
    "name",
    "avatarUrl",
    "bio",
    "city",
    "contactNumber",
  ]);
  if (changes.avatarUrl !== undefined && !imageUrl(changes.avatarUrl))
    fail(400, "Use an uploaded profile image");
  if (
    changes.name !== undefined &&
    (typeof changes.name !== "string" || changes.name.trim().length < 2)
  )
    fail(400, "Enter your name using at least two characters");
  Object.assign(req.user, changes);
  await req.user.save();
  res.json(await profiles(req.user));
});

async function saveBusiness(req, res, kind, creating) {
  const Model = kind === "organizer" ? Organizer : Vendor;
  let business = await Model.findOne({ user: req.user._id });
  if (creating && business)
    fail(409, "You already have this profile. Edit it instead");
  if (!creating && !business) fail(404, "Set up this profile first");
  const fields = [
    "businessName",
    "description",
    "logoUrl",
    "city",
    "contactNumber",
    "email",
    "socialMedia",
  ];
  if (kind === "vendor") fields.push("category", "products");
  const changes = pick(req.body, fields);
  if (changes.logoUrl !== undefined && !imageUrl(changes.logoUrl))
    fail(400, "Use an uploaded business logo");
  if (kind === "organizer") {
    if (changes.businessName !== undefined) changes.name = changes.businessName;
    delete changes.businessName;
  }
  business ||= new Model({ user: req.user._id });
  Object.assign(business, changes);
  const name = kind === "organizer" ? business.name : business.businessName;
  if (typeof name !== "string" || name.trim().length < 2 || name.length > 150)
    fail(400, "Enter a profile name of 2-150 characters");
  if (!emailPattern.test(business.email || "") || business.email.length > 254)
    fail(400, "Provide a valid public contact email");
  for (const [field, limit] of [
    ["description", 5000],
    ["city", 150],
    ["contactNumber", 50],
  ])
    if (
      typeof business[field] !== "string" ||
      !business[field].trim() ||
      business[field].length > limit
    )
      fail(400, `Complete your ${field} (maximum ${limit} characters)`);
  if (
    typeof business.socialMedia !== "string" ||
    business.socialMedia.length > 500
  )
    fail(400, "Social page must be at most 500 characters");
  if (kind === "vendor") {
    if (
      !business.category ||
      !(await Category.exists({ _id: business.category }))
    )
      fail(400, "Choose an existing business category");
    if (!business.products?.trim())
      fail(400, "Describe your products or services");
  }
  // Only the authenticated account supplies the link; existing unlinked records remain untouched.
  await business.save();
  res.status(creating ? 201 : 200).json(await profiles(req.user));
}
for (const kind of ["organizer", "vendor"]) {
  router.post(`/${kind}`, (req, res) => saveBusiness(req, res, kind, true));
  router.patch(`/${kind}`, (req, res) => saveBusiness(req, res, kind, false));
}
module.exports = router;
