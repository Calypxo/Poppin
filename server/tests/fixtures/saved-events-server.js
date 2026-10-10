// The browser suite uses a disposable database and the actual root entry point.
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const { seedSavedEventsData } = require("./savedEventsData");

async function start() {
  const mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri("poppin_saved_events_browser_test");
  process.env.JWT_SECRET = "saved-events-browser-test-secret-only";
  process.env.PORT = "3001";
  process.env.NODE_ENV = "test";
  process.env.CLIENT_ORIGIN = "http://127.0.0.1:5175";
  await mongoose.connect(process.env.MONGO_URI);
  await seedSavedEventsData({ withSaved: true });
  await mongoose.disconnect();
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, async () => {
    await mongoose.disconnect();
    await mongo.stop();
    process.exit(0);
  });
  require("../../../app");
}
start().catch((error) => { console.error(error); process.exit(1); });
