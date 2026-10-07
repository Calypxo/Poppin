const mongoose = require("mongoose");

const vendorApplicationSchema = new mongoose.Schema(
  {
    // Older applications retain their explicit VendorProfile link. New requests
    // always set user and event from authentication and the selected vendor call.
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "VendorProfile" },
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
      maxlength: 150,
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
      maxlength: 254,
    },

    contactNumber: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
      maxlength: 50,
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
      maxlength: 2000,
    },

    businessDescription: {
      type: String,
      default: "",
      trim: true,
      maxlength: 5000,
    },

    socialMedia: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "withdrawn"],
      default: "pending",
    },

    organizerRemarks: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  },
);

vendorApplicationSchema.index(
  { user: 1, event: 1 },
  {
    unique: true,
    partialFilterExpression: {
      user: { $type: "objectId" },
      event: { $type: "objectId" },
    },
  },
);

vendorApplicationSchema.index(
  { vendorCall: 1, vendor: 1 },
  { unique: true, partialFilterExpression: { vendor: { $type: "objectId" } } },
);

module.exports = mongoose.model("VendorApplication", vendorApplicationSchema);
