const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    businessName: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, default: "", maxlength: 5000 },
    logoUrl: { type: String, default: "" },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    products: { type: String, default: "", maxlength: 2000 },
    city: { type: String, default: "", trim: true },
    contactNumber: { type: String, default: "", trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    socialMedia: { type: String, default: "" },
  },
  { timestamps: true },
);
module.exports = mongoose.model("VendorProfile", schema);
