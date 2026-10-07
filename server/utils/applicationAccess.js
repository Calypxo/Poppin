const Vendor = require("../models/VendorProfile");
const Call = require("../models/VendorCall");

async function applicantFilter(user, session = null) {
  const vendor = await Vendor.findOne({ user: user._id })
    .select("_id")
    .session(session);
  return vendor
    ? { $or: [{ user: user._id }, { user: null, vendor: vendor._id }] }
    : { user: user._id };
}

async function applicationEventFilter(event, session = null) {
  const calls = await Call.find({ event }).select("_id").session(session);
  return {
    $or: [{ event }, { vendorCall: { $in: calls.map((call) => call._id) } }],
  };
}

module.exports = { applicantFilter, applicationEventFilter };
