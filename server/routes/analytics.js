const express = require("express");

const Organizer = require("../models/Organizer");
const Event = require("../models/Event");
const Venue = require("../models/Venue");
const VendorCall = require("../models/VendorCall");
const VendorApplication = require("../models/VendorApplication");

const router = express.Router();

// ------------------------------------------------------
// ADMIN OVERVIEW ANALYTICS
// GET /api/analytics/overview
// ------------------------------------------------------
router.get("/overview", async (req, res, next) => {
  try {
    const now = new Date();

    // --------------------------------------------------
    // BASIC TOTALS
    // --------------------------------------------------
    const [
      totalOrganizers,
      verifiedOrganizers,
      totalEvents,
      totalVenues,
      totalVendorCalls,
      totalApplications,
    ] = await Promise.all([
      Organizer.countDocuments(),
      Organizer.countDocuments({
        status: "verified",
      }),
      Event.countDocuments(),
      Venue.countDocuments(),
      VendorCall.countDocuments(),
      VendorApplication.countDocuments(),
    ]);

    // --------------------------------------------------
    // EVENT STATUS COUNTS
    // --------------------------------------------------
    const [
      draftEvents,
      pendingEvents,
      publishedEvents,
      rejectedEvents,
      cancelledEvents,
    ] = await Promise.all([
      Event.countDocuments({
        status: "draft",
      }),
      Event.countDocuments({
        status: "pending",
      }),
      Event.countDocuments({
        status: "published",
      }),
      Event.countDocuments({
        status: "rejected",
      }),
      Event.countDocuments({
        status: "cancelled",
      }),
    ]);

    // --------------------------------------------------
    // UPCOMING PUBLISHED EVENTS
    // --------------------------------------------------
    const upcomingEvents = await Event.countDocuments({
      status: "published",
      startDate: {
        $gte: now,
      },
    });

    // --------------------------------------------------
    // VENDOR APPLICATION STATUS COUNTS
    // --------------------------------------------------
    const [
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      withdrawnApplications,
    ] = await Promise.all([
      VendorApplication.countDocuments({
        status: "pending",
      }),
      VendorApplication.countDocuments({
        status: "approved",
      }),
      VendorApplication.countDocuments({
        status: "rejected",
      }),
      VendorApplication.countDocuments({
        status: "withdrawn",
      }),
    ]);

    // --------------------------------------------------
    // VENDOR SLOT CALCULATION
    // --------------------------------------------------
    const vendorCalls = await VendorCall.find({
      isActive: true,
    }).select("totalSlots");

    const totalVendorSlots = vendorCalls.reduce(
      (total, vendorCall) =>
        total + vendorCall.totalSlots,
      0
    );

    const availableVendorSlots = Math.max(
      totalVendorSlots - approvedApplications,
      0
    );

    // --------------------------------------------------
    // APPROVAL RATE
    // --------------------------------------------------
    const reviewedApplications =
      approvedApplications + rejectedApplications;

    const approvalRate =
      reviewedApplications > 0
        ? Math.round(
            (approvedApplications /
              reviewedApplications) *
              100
          )
        : 0;

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------
    res.status(200).json({
      totals: {
        organizers: totalOrganizers,
        verifiedOrganizers,
        events: totalEvents,
        venues: totalVenues,
        vendorCalls: totalVendorCalls,
        vendorApplications: totalApplications,
      },

      events: {
        draft: draftEvents,
        pending: pendingEvents,
        published: publishedEvents,
        rejected: rejectedEvents,
        cancelled: cancelledEvents,
        upcoming: upcomingEvents,
      },

      vendorApplications: {
        pending: pendingApplications,
        approved: approvedApplications,
        rejected: rejectedApplications,
        withdrawn: withdrawnApplications,
        approvalRate,
      },

      vendorSlots: {
        total: totalVendorSlots,
        occupied: approvedApplications,
        available: availableVendorSlots,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;