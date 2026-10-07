const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
function localDay(date) {
  const parts = dayFormatter.formatToParts(new Date(date));
  const value = (type) => parts.find((part) => part.type === type).value;
  return Date.UTC(
    Number(value("year")),
    Number(value("month")) - 1,
    Number(value("day")),
  );
}
// Event dates represent market days; separate startTime/endTime describe hours.
// Include the whole final day instead of ending a date-only event at midnight.
function eventState(event, now = new Date()) {
  const today = localDay(now);
  const start = localDay(event.startDate);
  const end = localDay(event.endDate);
  return {
    eventState:
      today < start ? "upcoming" : today <= end ? "ongoing" : "completed",
    daysUntilStart: Math.max(0, Math.round((start - today) / 86400000)),
  };
}
module.exports = { eventState };
