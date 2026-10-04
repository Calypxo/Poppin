const mongoose = require("mongoose");

const vendorApplicationSchema = new mongoose.Schema(
  {
    vendorCall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VendorCall",
      required: [true, "Vendor call is required"],
    },

    applicationCode: {
      type: String,
      required: [true, "Application code is required"],
      unique: true,
      trim: true,
    },

    businessName: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
    },

    representativeName: {
      type: String,
      required: [true, "Representative name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },

    contactNumber: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Business category is required"],
    },

    products: {
      type: String,
      required: [true, "Products or services are required"],
      trim: true,
    },

    businessDescription: {
      type: String,
      required: [true, "Business description is required"],
      trim: true,
    },

    socialMedia: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "withdrawn"],
      default: "pending",
    },

    organizerRemarks: {
      type: String,
      trim: true,
      default: "",
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent the same email from applying twice to the same vendor call
vendorApplicationSchema.index(
  { vendorCall: 1, email: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "VendorApplication",
  vendorApplicationSchema
);