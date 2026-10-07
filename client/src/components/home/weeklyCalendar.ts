import type { Event } from "../../types/event";

const dayLength = 86400000;
const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function localDateKey(value: Date | string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
}

export function calendarWeek(offset = 0, now = new Date()) {
  // Date arithmetic uses UTC calendar dates; the date itself comes from Manila.
  const today = localDateKey(now);
  const date = new Date(`${today}T00:00:00Z`);
  const monday = date.getTime() - ((date.getUTCDay() + 6) % 7) * dayLength;
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday + (offset * 7 + index) * dayLength);
    return {
      key: day.toISOString().slice(0, 10),
      date: day,
      number: day.getUTCDate(),
      weekday: day.toLocaleDateString("en-PH", {
        weekday: "short",
        timeZone: "UTC",
      }),
      label: day.toLocaleDateString("en-PH", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }),
      today: day.toISOString().slice(0, 10) === today,
    };
  });
}

export function eventsOnDay(events: Event[], day: string) {
  return events
    .filter((event) => {
      const start = localDateKey(event.startDate);
      const end = localDateKey(event.endDate);
      return (
        event.status === "published" &&
        start &&
        end &&
        start <= day &&
        end >= day
      );
    })
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime() ||
        a.title.localeCompare(b.title),
    );
}

export function calendarHours(event: Event) {
  if (
    !event.startTime ||
    !event.endTime ||
    /tba/i.test(`${event.startTime} ${event.endTime}`)
  )
    return "Hours TBA";
  const format = (time: string) => {
    const match = /^(\d{2}):(\d{2})$/.exec(time);
    if (!match) return time;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour > 23 || minute > 59) return time;
    return `${hour % 12 || 12}${minute ? `:${match[2]}` : ""} ${hour >= 12 ? "PM" : "AM"}`;
  };
  return `${format(event.startTime)} – ${format(event.endTime)}`;
}
