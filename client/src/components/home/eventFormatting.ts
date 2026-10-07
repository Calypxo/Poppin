import type { Event } from "../../types/event";

const timeZone = "Asia/Manila";
export function eventDate(
  date: string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
) {
  const value = new Date(date);
  return Number.isNaN(value.getTime())
    ? "Date to be announced"
    : value.toLocaleDateString("en-PH", { ...options, timeZone });
}

export function eventLocation(event: Event) {
  return (
    [event.venue?.name, event.venue?.city].filter(Boolean).join(" · ") ||
    "Venue to be announced"
  );
}

export function eventStatus(event: Event) {
  if (event.status === "draft") return "Draft";
  if (event.status === "cancelled") return "Cancelled";
  if (event.eventState === "ongoing") return "Happening now";
  if (event.eventState === "completed") return "Past event";
  if (event.eventState === "upcoming" && event.daysUntilStart !== undefined) {
    if (event.daysUntilStart === 0) return "Happening today";
    return `In ${event.daysUntilStart} ${event.daysUntilStart === 1 ? "day" : "days"}`;
  }
  return event.eventState === "upcoming" ? "Upcoming" : "Published";
}
