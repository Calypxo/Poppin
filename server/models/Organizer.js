const mongoose = require("mongoose");

const organizerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Organizer name is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      unique: true,
    },

    contactNumber: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },

    socialMedia: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "verified",
        "rejected",
      ],
      default: "pending",
    },

    rejectionReason: {
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
  }
);

module.exports = mongoose.model(
  "Organizer",
  organizerSchema
);