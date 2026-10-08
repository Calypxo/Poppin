import type { Event } from "../../types/event";
import { calendarWeek, localDateKey } from "./weeklyCalendar";

export type WeekendPeriod = "this-weekend" | "next-weekend" | "upcoming";

export function weekendSelection(
  events: Event[],
  period: WeekendPeriod,
  now = new Date(),
) {
  const today = localDateKey(now);
  const week = calendarWeek(period === "next-weekend" ? 1 : 0, now);
  const friday = week[4].key;
  const sunday = week[6].key;
  // Keep ongoing events, but don't recommend days that have already ended.
  const from = period === "upcoming" ? today : [today, friday].sort()[1];
  const to = period === "upcoming" ? "" : sunday;
  const seen = new Set<string>();
  const matches = events
    .filter((event) => {
      const start = localDateKey(event.startDate);
      const end = localDateKey(event.endDate);
      if (
        event.status !== "published" || !start || !end || start > end ||
        end < from || (to && start > to) || seen.has(event._id)
      ) return false;
      seen.add(event._id);
      return true;
    })
    .sort((a, b) =>
      localDateKey(a.startDate).localeCompare(localDateKey(b.startDate)) ||
      a.title.localeCompare(b.title),
    );
  const query = new URLSearchParams({ from });
  if (to) query.set("to", to);
  const format = (date: string) => new Date(`${date}T00:00:00Z`)
    .toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "UTC" });
  const range = period === "upcoming"
    ? `From ${format(today)} onward`
    : `${format(friday)} – ${format(sunday)}`;
  return { events: matches, range, discoverUrl: `/discover?${query}` };
}
