const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, default: "" },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event is required"],
    },

    title: {
      type: String,
      required: [true, "Announcement title is required"],
      trim: true,
    },

    content: {
      type: String,
      required: [true, "Announcement content is required"],
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "announcement",
        "vendor_call",
        "lineup",
        "general",
        "schedule_update",
        "reminder",
        "important",
      ],
      default: "general",
    },

    isPublished: {
      type: Boolean,
      default: true,
    },

    publishedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Announcement", announcementSchema);
