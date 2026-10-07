const mongoose = require("mongoose");

const venueSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: {
      type: String,
      required: [true, "Venue name is required"],
      trim: true,
    },

    address: {
      type: String,
      required: [true, "Venue address is required"],
      trim: true,
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },

    province: {
      type: String,
      default: "Pampanga",
      trim: true,
    },

    venueType: {
      type: String,
      required: [true, "Venue type is required"],
      enum: [
        "Mall",
        "Outdoor Market",
        "Community Space",
        "Park",
        "Cafe",
        "Convention Venue",
        "Lifestyle Center",
        "Other",
      ],
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Venue", venueSchema);
