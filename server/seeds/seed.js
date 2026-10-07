require("dotenv").config();

const dns = require("dns");
const mongoose = require("mongoose");

const User = require("../models/User");
const VendorProfile = require("../models/VendorProfile");
const bcrypt = require("bcryptjs");
const Organizer = require("../models/Organizer");
const Venue = require("../models/Venue");
const Category = require("../models/Category");
const Event = require("../models/Event");
const Announcement = require("../models/Announcement");
const VendorCall = require("../models/VendorCall");
const VendorApplication = require("../models/VendorApplication");

// Needed because of the DNS issue we encountered earlier
dns.setServers(["8.8.8.8", "8.8.4.4"]);

async function seedDatabase() {
  try {
    if (
      !process.env.DEMO_PASSWORD ||
      process.env.DEMO_PASSWORD.length < 8 ||
      Buffer.byteLength(process.env.DEMO_PASSWORD) > 72
    )
      throw new Error(
        "Set DEMO_PASSWORD to 8?72 bytes for the optional empty-database seed",
      );
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB");

    const collections = [
      User,
      VendorProfile,
      Organizer,
      Venue,
      Category,
      Event,
      Announcement,
      VendorCall,
      VendorApplication,
    ];
    const existing = await Promise.all(
      collections.map((model) => model.exists({})),
    );
    if (existing.some(Boolean))
      throw new Error(
        "Seed requires an empty database. Use a separate demo database to preserve existing records.",
      );

    // Existing databases are never cleared or seeded.
    // Categories
    const categories = await Category.insertMany([
      {
        name: "Flea Market",
        description: "Local flea markets and community selling events.",
      },
      {
        name: "Bazaar",
        description: "Temporary bazaars featuring local businesses.",
      },
      {
        name: "Food & Drinks",
        description: "Food festivals, drink events, and food pop-ups.",
      },
      {
        name: "Coffee & Matcha",
        description: "Coffee, tea, matcha, and cafe-related events.",
      },
      {
        name: "Art & Creative",
        description: "Art markets, exhibits, and creative events.",
      },
      {
        name: "Fashion & Thrift",
        description: "Fashion markets, thrift events, and clothing pop-ups.",
      },
      {
        name: "Workshops",
        description: "Hands-on workshops and learning experiences.",
      },
      {
        name: "Community",
        description: "Community-focused activities and local gatherings.",
      },
    ]);

    console.log("Categories created");

    // Venues
    const venues = await Venue.insertMany([
      {
        name: "Plaza Anghel",
        address: "Angeles City, Pampanga",
        city: "Angeles City",
        venueType: "Outdoor Market",
        description: "Outdoor community event venue.",
      },
      {
        name: "Orchard: A Community Place",
        address: "City of San Fernando, Pampanga",
        city: "City of San Fernando",
        venueType: "Community Space",
        description: "Community venue for markets and local events.",
      },
      {
        name: "The Shoppes at Infinity",
        address: "Angeles City, Pampanga",
        city: "Angeles City",
        venueType: "Lifestyle Center",
        description: "Lifestyle and commercial event venue.",
      },
    ]);

    console.log("Venues created");

    const passwordHash = await bcrypt.hash(process.env.DEMO_PASSWORD, 12);
    const users = await User.insertMany([
      {
        name: "Demo Explorer",
        email: "explorer@example.invalid",
        passwordHash,
      },
      {
        name: "Kulitan Organizer",
        email: "kulitan@demo.com",
        passwordHash,
      },
      {
        name: "Weekend Organizer",
        email: "weekendcollective@demo.com",
        passwordHash,
      },
      {
        name: "Anna Cruz",
        email: "matchamama@example.com",
        passwordHash,
      },
      {
        name: "Mia Santos",
        email: "bakeandbloom@example.com",
        passwordHash,
      },
    ]);
    // Organizers
    const organizers = await Organizer.insertMany([
      {
        user: users[1]._id,
        name: "Kulitan Flea Market",
        description: "Community flea market organizer in Pampanga.",
        email: "kulitan@demo.com",
        contactNumber: "09123456781",
        city: "Angeles City",
        socialMedia: "@kulitan.demo",
      },
      {
        user: users[2]._id,
        name: "Pampanga Weekend Collective",
        description: "Organizer of local markets and community pop-up events.",
        email: "weekendcollective@demo.com",
        contactNumber: "09123456782",
        city: "City of San Fernando",
        socialMedia: "@weekendcollective.demo",
      },
    ]);

    console.log("Organizers created");

    const fleaMarketCategory = categories.find(
      (category) => category.name === "Flea Market",
    );

    const foodCategory = categories.find(
      (category) => category.name === "Food & Drinks",
    );

    const matchaCategory = categories.find(
      (category) => category.name === "Coffee & Matcha",
    );

    // Events
    const events = await Event.insertMany([
      {
        title: "Kulitan Flea Market - October Edition",
        description:
          "A community flea market featuring local sellers, creatives, and small businesses.",
        organizer: organizers[0]._id,
        venue: venues[0]._id,
        categories: [fleaMarketCategory._id],
        startDate: new Date("2026-10-17"),
        endDate: new Date("2026-10-17"),
        startTime: "4:00 PM",
        endTime: "9:00 PM",
        status: "published",
        isFeatured: true,
      },
      {
        title: "Matcha Fest Pampanga",
        description:
          "A weekend event featuring matcha drinks, desserts, local food brands, and lifestyle merchants.",
        organizer: organizers[1]._id,
        venue: venues[1]._id,
        categories: [foodCategory._id, matchaCategory._id],
        startDate: new Date("2026-10-24"),
        endDate: new Date("2026-10-25"),
        startTime: "10:00 AM",
        endTime: "8:00 PM",
        status: "published",
        isFeatured: true,
      },
    ]);

    console.log("Events created");

    // Announcements
    await Announcement.insertMany([
      {
        event: events[0]._id,
        title: "October Market Schedule",
        content:
          "The October edition of Kulitan Flea Market will be held on October 17.",
        type: "general",
      },
      {
        event: events[1]._id,
        title: "Vendor Applications Are Open",
        content:
          "Local food, matcha, dessert, and lifestyle businesses may now apply.",
        type: "important",
      },
    ]);

    console.log("Announcements created");

    // Vendor Call
    const vendorCall = await VendorCall.create({
      event: events[1]._id,
      title: "Calling All Matcha Fest Vendors",
      description:
        "We are looking for matcha brands, food businesses, dessert shops, and local lifestyle merchants.",
      applicationStartDate: new Date("2026-10-04"),
      applicationDeadline: new Date("2026-10-15"),
      totalSlots: 20,
      boothFee: 1500,
      boothSize: "2m x 2m",
      requirements: [
        "Business name",
        "Product list",
        "Contact information",
        "Social media page",
      ],
      acceptedCategories: [foodCategory._id, matchaCategory._id],
      status: "open",
    });

    console.log("Vendor call created");

    // Sample Vendor Applications
    const applications = [
      {
        vendorCall: vendorCall._id,
        applicationCode: "POP-APP-0001",
        businessName: "Matcha Mama PH",
        representativeName: "Anna Cruz",
        email: "matchamama@example.com",
        contactNumber: "09171234567",
        category: matchaCategory._id,
        products: "Matcha latte, strawberry matcha, matcha cookies",
        businessDescription:
          "A small local matcha business serving handcrafted drinks and desserts.",
        socialMedia: "@matchamamaph",
        status: "pending",
      },
      {
        vendorCall: vendorCall._id,
        applicationCode: "POP-APP-0002",
        businessName: "Bake & Bloom",
        representativeName: "Mia Santos",
        email: "bakeandbloom@example.com",
        contactNumber: "09181234567",
        category: foodCategory._id,
        products: "Cookies, brownies, pastries",
        businessDescription:
          "A Pampanga-based home bakery specializing in fresh pastries.",
        socialMedia: "@bakeandbloom",
        status: "accepted",
        organizerRemarks: "Accepted for Matcha Fest.",
        reviewedAt: new Date(),
      },
    ];
    for (const [index, application] of applications.entries()) {
      application.user = users[3 + index]._id;
      application.event = vendorCall.event;
    }
    await VendorApplication.insertMany(applications);

    console.log("Vendor applications created");

    console.log("");
    console.log("Popp'in database seeded successfully!");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Seed failed:", error.message);

    await mongoose.disconnect();

    process.exit(1);
  }
}

seedDatabase();
