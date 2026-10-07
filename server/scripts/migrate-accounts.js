// Preview by default. Back up the database before passing --apply.
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const dns = require("node:dns");
const Event = require("../models/Event");
const Organizer = require("../models/Organizer");
const Application = require("../models/VendorApplication");
const User = require("../models/User");
const Vendor = require("../models/VendorProfile");
async function main() {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
  await mongoose.connect(process.env.MONGO_URI, {
    autoIndex: false,
    autoCreate: false,
  });
  try {
    const counts = {
      eventStatesToNormalize: await Event.countDocuments({
        status: { $in: ["pending", "rejected"] },
      }),
      applicationStatesToNormalize: await Application.countDocuments({
        status: "approved",
      }),
      unclaimedOrganizers: await Organizer.countDocuments({ user: null }),
      legacyApplicationsWithoutUser: await Application.countDocuments({
        user: { $exists: false },
      }),
    };
    console.log(JSON.stringify(counts, null, 2));
    const argument = (flag) => {
      const index = process.argv.indexOf(flag);
      return index < 0 ? null : process.argv[index + 1];
    };
    const organizerId = argument("--link-organizer");
    const userId = argument("--user");
    let link = null;
    if (organizerId || userId) {
      if (
        !mongoose.isValidObjectId(organizerId) ||
        !mongoose.isValidObjectId(userId)
      )
        throw new Error("Provide both --link-organizer <id> and --user <id>");
      const [target, user, current] = await Promise.all([
        Organizer.findById(organizerId),
        User.findById(userId),
        Organizer.findOne({ user: userId }),
      ]);
      if (!target || !user?.isActive)
        throw new Error(
          "An existing organizer and active account are required",
        );
      if (target.user && String(target.user) !== userId)
        throw new Error("The organizer is already owned by another account");
      if (current && String(current._id) !== organizerId) {
        if (
          (await Event.exists({ organizer: current._id })) ||
          current.description ||
          current.logoUrl ||
          current.city ||
          current.contactNumber ||
          current.socialMedia
        )
          throw new Error(
            "The account’s current profile has data. Merge it deliberately instead of replacing it",
          );
      }
      link = {
        target,
        user,
        replace:
          current && String(current._id) !== organizerId ? current : null,
      };
      console.log(
        JSON.stringify(
          {
            linkOrganizer: target._id,
            toUser: user._id,
            replaceUnusedRegistrationProfile: link.replace?._id || null,
          },
          null,
          2,
        ),
      );
    }
    if (!process.argv.includes("--apply")) {
      console.log(
        "Preview only. No records changed. Use --apply after backup to normalize states and create account indexes.",
      );
      return;
    }
    await Event.updateMany(
      { status: { $in: ["pending", "rejected"] } },
      { $set: { status: "draft" }, $unset: { rejectionReason: "" } },
    );
    await Organizer.updateMany(
      {},
      { $unset: { status: "", rejectionReason: "" } },
    );
    await Application.updateMany(
      { status: "approved" },
      { $set: { status: "accepted" } },
    );
    await Promise.all([
      User.createIndexes(),
      Vendor.createIndexes(),
      Organizer.createIndexes(),
      Application.createIndexes(),
    ]);
    const indexes = await Application.collection.indexes();
    const oldEmailIndex = indexes.find(
      (index) =>
        index.unique &&
        index.key.vendorCall === 1 &&
        index.key.email === 1 &&
        Object.keys(index.key).length === 2,
    );
    if (oldEmailIndex)
      await Application.collection.dropIndex(oldEmailIndex.name);
    if (link)
      await mongoose.connection.transaction(async (session) => {
        if (link.replace)
          await Organizer.deleteOne(
            { _id: link.replace._id, user: link.user._id },
            { session },
          );
        const linked = await Organizer.updateOne(
          {
            _id: link.target._id,
            $or: [{ user: null }, { user: link.user._id }],
          },
          { $set: { user: link.user._id } },
          { session },
        );
        if (linked.matchedCount !== 1)
          throw new Error(
            "Organizer ownership changed; the link was rolled back",
          );
      });
    console.log(
      link
        ? "States and indexes updated; the explicitly selected organizer is linked. Existing events and applications are preserved."
        : "States and indexes updated. No records deleted, profiles claimed, or applications reassigned.",
    );
  } finally {
    await mongoose.disconnect();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
