// Preview by default. --apply replaces only the obsolete email uniqueness index.
// Existing application documents are never updated or deleted.
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const dns = require("node:dns");
const fs = require("node:fs");
const Application = require("../models/VendorApplication");

async function main() {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
  await mongoose.connect(process.env.MONGO_URI, {
    autoIndex: false,
    autoCreate: false,
  });
  try {
    const indexes = await Application.collection.indexes();
    const applicationCount = await Application.countDocuments();
    const obsolete = indexes.filter(
      (index) =>
        index.unique &&
        index.key.vendorCall === 1 &&
        index.key.email === 1 &&
        Object.keys(index.key).length === 2,
    );
    const duplicates = await Application.aggregate([
      { $match: { user: { $type: "objectId" }, event: { $type: "objectId" } } },
      {
        $group: { _id: { user: "$user", event: "$event" }, count: { $sum: 1 } },
      },
      { $match: { count: { $gt: 1 } } },
      { $count: "groups" },
    ]);
    const conflicts = duplicates[0]?.groups || 0;
    console.log(
      JSON.stringify(
        {
          obsoleteEmailIndexes: obsolete.map((index) => index.name),
          duplicateUserEventGroups: conflicts,
        },
        null,
        2,
      ),
    );
    if (conflicts)
      throw new Error(
        "Existing user/event duplicates need deliberate review. No indexes changed.",
      );
    if (!process.argv.includes("--apply")) {
      console.log(
        "Preview only. Use --apply to create current application indexes and remove only obsolete vendorCall/email uniqueness.",
      );
      return;
    }
    await Application.createIndexes();
    const current = (await Application.collection.indexes()).find(
      (index) =>
        index.unique &&
        index.key.user === 1 &&
        index.key.event === 1 &&
        Object.keys(index.key).length === 2 &&
        index.partialFilterExpression?.user?.$type === "objectId" &&
        index.partialFilterExpression?.event?.$type === "objectId",
    );
    if (!current)
      throw new Error(
        "Required unique user/event index was not found. Obsolete indexes were preserved.",
      );
    for (const index of obsolete)
      await Application.collection.dropIndex(index.name);
    const reportFlag = process.argv.indexOf("--report");
    if (reportFlag >= 0) {
      const reportPath = process.argv[reportFlag + 1];
      if (!reportPath) throw new Error("Provide a path after --report");
      fs.writeFileSync(
        reportPath,
        JSON.stringify(
          {
            checkedAt: new Date().toISOString(),
            removedIndexes: obsolete.map(({ name, key }) => ({ name, key })),
            userEventIndex: {
              name: current.name,
              key: current.key,
              unique: current.unique,
              partialFilterExpression: current.partialFilterExpression,
            },
            applicationsBefore: applicationCount,
            applicationsAfter: await Application.countDocuments(),
            recordsUpdated: 0,
            recordsDeleted: 0,
          },
          null,
          2,
        ) + "\n",
      );
    }
    console.log(
      "Application indexes updated. No application records changed or deleted.",
    );
  } finally {
    await mongoose.disconnect();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
