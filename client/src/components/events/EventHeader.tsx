import { CalendarDays, Clock3, MapPin } from "lucide-react";
import type { Event } from "../../types/event";
import StatusBadge from "../shared/StatusBadge";
import OrganizerIdentity from "../shared/OrganizerIdentity";
import { EventPoster } from "../home/EventPresentation";
import { eventDate } from "../home/eventFormatting";
import { calendarHours } from "../home/weeklyCalendar";
import SaveEventButton from "./SaveEventButton";

export default function EventHeader({ event }: { event: Event }) {
  const firstDay = eventDate(event.startDate);
  const lastDay = eventDate(event.endDate);
  return (
    <header className="poppin-event-hero">
      <div className="poppin-event-hero-poster">
        <EventPoster event={event} contain eager />
      </div>
      <div className="poppin-event-hero-copy">
        <div className="poppin-event-hero-kicker">
          <span>
            <MapPin size={14} aria-hidden="true" />
            {event.venue?.city || "Pampanga"}
          </span>
          <StatusBadge
            status={
              event.status === "published"
                ? event.eventState || event.status
                : event.status
            }
          />
        </div>
        <h1>{event.title}</h1>
        <div className="poppin-event-host">
          <span>Hosted by</span>
          <OrganizerIdentity organizer={event.organizer} />
        </div>
        <dl className="poppin-event-essential">
          <div>
            <CalendarDays size={20} aria-hidden="true" />
            <div>
              <dt>Save the date</dt>
              <dd>
                {firstDay === lastDay ? firstDay : firstDay + " – " + lastDay}
              </dd>
            </div>
          </div>
          <div>
            <Clock3 size={20} aria-hidden="true" />
            <div>
              <dt>Market hours</dt>
              <dd>{calendarHours(event)}</dd>
            </div>
          </div>
          <div>
            <MapPin size={20} aria-hidden="true" />
            <div>
              <dt>{event.venue?.name || "The location"}</dt>
              <dd>
                {[
                  event.venue?.address,
                  event.venue?.city,
                  event.venue?.province,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </dd>
            </div>
          </div>
        </dl>
        <div className="poppin-event-categories" aria-label="Event categories">
          {event.categories.map((category) => (
            <span key={category._id}>{category.name}</span>
          ))}
        </div>
        <div className="poppin-event-save-actions">
          <SaveEventButton event={event} />
        </div>
      </div>
    </header>
  );
}
