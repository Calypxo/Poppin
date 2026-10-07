import { Link } from "react-router-dom";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import type { Event } from "../../types/event";
import StatusBadge from "../shared/StatusBadge";
import { EventPoster } from "../home/EventPresentation";
import { eventDate } from "../home/eventFormatting";
export default function EventHeader({ event }: { event: Event }) {
  return (
    <header className="poppin-event-header">
      <div className="poppin-detail-poster">
        <EventPoster event={event} contain eager />
      </div>
      <div className="poppin-event-summary">
        <StatusBadge
          status={
            event.status === "published"
              ? event.eventState || event.status
              : event.status
          }
        />
        <h1>{event.title}</h1>
        <p>
          Hosted by{" "}
          <Link to={`/organizers/${event.organizer._id}`}>
            {event.organizer.name}
          </Link>
        </p>
        <div className="poppin-event-facts">
          <div>
            <CalendarDays size={20} aria-hidden="true" />
            <p>
              <strong>Save the date</strong>
              {eventDate(event.startDate)} – {eventDate(event.endDate)}
            </p>
          </div>
          <div>
            <Clock size={20} aria-hidden="true" />
            <p>
              <strong>Market hours</strong>
              {event.startTime} – {event.endTime}
            </p>
          </div>
          <div>
            <MapPin size={20} aria-hidden="true" />
            <p>
              <strong>{event.venue?.name}</strong>
              {event.venue?.address}, {event.venue?.city},{" "}
              {event.venue?.province}
            </p>
          </div>
        </div>
        <div className="poppin-actions">
          {event.categories.map((category) => (
            <span className="poppin-status" key={category._id}>
              {category.name}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
