const mongoose = require("mongoose");

const vendorCallSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event is required"],
    },

    title: {
      type: String,
      required: [true, "Vendor call title is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Vendor call description is required"],
      trim: true,
    },

    applicationStartDate: {
      type: Date,
      required: [true, "Application start date is required"],
    },

    applicationDeadline: {
      type: Date,
      required: [true, "Application deadline is required"],
    },

    totalSlots: {
      type: Number,
      required: [true, "Total vendor slots are required"],
      min: [1, "Total slots must be at least 1"],
    },

    boothFee: {
      type: Number,
      required: [true, "Booth fee is required"],
      min: [0, "Booth fee cannot be negative"],
      default: 0,
    },

    boothSize: {
      type: String,
      trim: true,
      default: "",
    },

    requirements: {
      type: [String],
      default: [],
    },

    acceptedCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],

    status: {
      type: String,
      enum: ["draft", "open", "closed"],
      default: "draft",
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

module.exports = mongoose.model("VendorCall", vendorCallSchema);