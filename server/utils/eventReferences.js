const Organizer = require("../models/Organizer");
const Venue = require("../models/Venue");
const Category = require("../models/Category");
async function eventReferences(event) {
  if (
    !event.organizer ||
    !event.venue ||
    !Array.isArray(event.categories) ||
    event.categories.length === 0
  ) {
    return {
      status: 400,
      message: "Organizer, venue and at least one category are required",
    };
  }
  const ids = [...new Set(event.categories.map(String))];
  const [organizer, venue, count] = await Promise.all([
    Organizer.exists({ _id: event.organizer }),
    Venue.exists({ _id: event.venue }),
    Category.countDocuments({ _id: { $in: ids } }),
  ]);
  if (!organizer || !venue || count !== ids.length)
    return {
      status: 404,
      message: "An organizer, venue or category could not be found",
    };
  return null;
}
module.exports = eventReferences;
