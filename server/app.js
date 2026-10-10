require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const dns = require("dns");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const requestLogger = require("./middleware/requestLogger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const healthRoutes = require("./routes/health");
const eventRoutes = require("./routes/events");
const organizerRoutes = require("./routes/organizers");
const venueRoutes = require("./routes/venues");
const categoryRoutes = require("./routes/categories");
const announcementRoutes = require("./routes/announcements");
const vendorCallRoutes = require("./routes/vendorCalls");
const vendorApplicationRoutes = require("./routes/vendorApplications");

const uploadRoutes = require("./routes/uploads");

const app = express();

const PORT = process.env.PORT || 3000;

// Needed for MongoDB Atlas SRV lookup on the current network
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// Middleware
app.use(requestLogger);

app.use(
  cors({
    origin(origin, callback) {
      const frontendOrigin =
        process.env.CLIENT_ORIGIN || "http://localhost:5173";
      // Vite can choose another port when its default port is occupied.
      const localDevelopmentOrigin =
        process.env.NODE_ENV !== "production" &&
        /^http:\/\/(?:localhost|127\.0\.0\.1|\[::1\]):\d{1,5}$/.test(
          origin || "",
        );

      callback(
        null,
        !origin || origin === frontendOrigin || localDevelopmentOrigin,
      );
    },
  }),
);

app.use(express.json());

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/saved-events", require("./routes/savedEvents"));
app.use("/api/organizers", organizerRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/vendor-calls", vendorCallRoutes);
app.use("/api/vendor-applications", vendorApplicationRoutes);
app.use("/api/auth", require("./routes/auth").router);
app.use("/api/profiles", require("./routes/profiles"));
app.use("/api/vendors", require("./routes/vendors"));
app.use("/api/posts", announcementRoutes);
app.use("/api/feed", require("./routes/feed"));
app.use("/api/uploads", uploadRoutes);

// 404 Catch-All
app.use(notFound);

// Error Handler
app.use(errorHandler);

// Connect to MongoDB first, then start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    // The user/event unique index must exist before accepting concurrent applications.
    await require("./models/VendorApplication").init();
    await require("./models/SavedEvent").init();
    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`Popp'in server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err.message);
  });
