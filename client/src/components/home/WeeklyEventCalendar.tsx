import { useId, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
} from "lucide-react";
import type { Event } from "../../types/event";
import {
  calendarHours,
  calendarWeek,
  eventsOnDay,
  localDateKey,
} from "./weeklyCalendar";

function CalendarEvent({ event, day }: { event: Event; day: string }) {
  const startsToday = localDateKey(event.startDate) === day;
  return (
    <Link
      to={`/events/${event._id}`}
      className="poppin-calendar-event"
      aria-label={`View ${event.title}`}
    >
      <div className="poppin-calendar-event-label">
        <span>{startsToday ? "POPPING UP" : "CONTINUES"}</span>
        <ArrowUpRight size={13} aria-hidden="true" />
      </div>
      <h4>{event.title}</h4>
      <p>
        <MapPin size={12} aria-hidden="true" />
        <span>{event.venue?.name || "Venue TBA"}</span>
      </p>
      <p>
        <Clock3 size={12} aria-hidden="true" />
        <span>{calendarHours(event)}</span>
      </p>
    </Link>
  );
}

export default function WeeklyEventCalendar({ events }: { events: Event[] }) {
  const [offset, setOffset] = useState(0);
  const [selectedKey, setSelectedKey] = useState("");
  const titleId = useId();
  const detailsId = useId();
  const days = calendarWeek(offset);
  const scheduled = days.map((day) => ({
    ...day,
    events: eventsOnDay(events, day.key),
  }));
  const today = localDateKey(new Date());
  const defaultDay =
    scheduled.find((day) => day.today && day.events.length) ||
    scheduled.find((day) => day.key >= today && day.events.length) ||
    scheduled.find((day) => day.events.length) ||
    scheduled[0];
  const selected =
    scheduled.find((day) => day.key === selectedKey) || defaultDay;
  const uniqueEvents = new Set(
    scheduled.flatMap((day) => day.events.map((event) => event._id)),
  ).size;
  const first = days[0].date;
  const last = days[6].date;
  const month = first.toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const range = `${first.toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "UTC" })} – ${last.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}`;

  function changeWeek(nextOffset: number) {
    setOffset(nextOffset);
    setSelectedKey("");
  }

  return (
    <div className="poppin-calendar" role="region" aria-labelledby={titleId}>
      <div className="poppin-calendar-toolbar">
        <div aria-live="polite" aria-atomic="true">
          <h3 id={titleId} className="poppin-calendar-month">
            <CalendarDays size={22} aria-hidden="true" />
            {month}
          </h3>
          <p className="poppin-calendar-range">
            {range}{" "}
            <span>
              · {uniqueEvents} {uniqueEvents === 1 ? "event" : "events"}
            </span>
          </p>
        </div>
        <div
          className="poppin-calendar-navigation"
          role="group"
          aria-label="Calendar weeks"
        >
          <button
            type="button"
            onClick={() => changeWeek(offset - 1)}
            aria-label="Previous week"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => changeWeek(0)}
            className="poppin-calendar-reset"
          >
            This week
          </button>
          <button
            type="button"
            onClick={() => changeWeek(offset + 1)}
            aria-label="Next week"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        className="poppin-calendar-desktop"
        role="group"
        aria-label={`Events for ${range}`}
      >
        {scheduled.map((day, index) => (
          <section
            key={day.key}
            className={`poppin-calendar-day ${day.today ? "is-today" : ""} ${index > 4 ? "is-weekend" : ""}`}
            aria-label={day.label}
          >
            <div className="poppin-calendar-day-heading">
              <span className="poppin-calendar-weekday">{day.weekday}</span>
              <time
                dateTime={day.key}
                aria-current={day.today ? "date" : undefined}
              >
                {day.number}
              </time>
              {day.today && (
                <span className="poppin-calendar-today-label">TODAY</span>
              )}
              {!day.today && day.events.length > 0 && (
                <span className="poppin-calendar-day-count">
                  {day.events.length}{" "}
                  {day.events.length === 1 ? "EVENT" : "EVENTS"}
                </span>
              )}
            </div>
            <div className="poppin-calendar-day-events">
              {day.events.length ? (
                day.events.map((event) => (
                  <CalendarEvent key={event._id} event={event} day={day.key} />
                ))
              ) : (
                <p className="poppin-calendar-empty-day">Open for plans</p>
              )}
            </div>
          </section>
        ))}
      </div>

      <div className="poppin-calendar-mobile">
        <div
          className="poppin-calendar-date-picker"
          role="group"
          aria-label="Choose a day"
        >
          {scheduled.map((day) => (
            <button
              key={day.key}
              type="button"
              className={`${day.today ? "is-today" : ""} ${day.key === selected.key ? "is-selected" : ""}`}
              aria-pressed={day.key === selected.key}
              aria-controls={detailsId}
              aria-label={`${day.label}${day.today ? ", today" : ""}, ${day.events.length} ${day.events.length === 1 ? "event" : "events"}`}
              onClick={() => setSelectedKey(day.key)}
            >
              <span className="poppin-calendar-weekday">{day.weekday}</span>
              <time
                dateTime={day.key}
                aria-current={day.today ? "date" : undefined}
              >
                {day.number}
              </time>
              <span
                className={`poppin-calendar-day-dot ${day.events.length ? "has-events" : ""}`}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
        <div
          id={detailsId}
          className="poppin-calendar-selected-day"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="poppin-calendar-selected-heading">
            <h4>
              {selected.date.toLocaleDateString("en-PH", {
                weekday: "long",
                month: "short",
                day: "numeric",
                timeZone: "UTC",
              })}
            </h4>
            <span>
              {selected.events.length}{" "}
              {selected.events.length === 1 ? "event" : "events"}
            </span>
          </div>
          {selected.events.length ? (
            selected.events.map((event) => (
              <CalendarEvent key={event._id} event={event} day={selected.key} />
            ))
          ) : (
            <p className="poppin-calendar-empty-selection">
              {uniqueEvents
                ? "A little room for spontaneous plans. Choose a marked day to see what’s popping up."
                : "No events scheduled for this week yet. Try another week or discover more local events below."}
            </p>
          )}
        </div>
      </div>

      <div className="poppin-calendar-legend">
        <span>
          <i className="poppin-calendar-legend-today" aria-hidden="true" />
          Today
        </span>
        <span>
          <i className="poppin-calendar-legend-event" aria-hidden="true" />
          Event day
        </span>
        <span>Times in Pampanga · Multi-day markets appear on every date.</span>
      </div>
    </div>
  );
}
