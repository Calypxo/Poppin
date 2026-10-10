import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Asterisk,
  MapPin,
  Ticket,
} from "lucide-react";
import type { Event } from "../../types/event";
import { ActionLink } from "../public/PublicPrimitives";
import { eventDate, eventLocation, eventStatus } from "./eventFormatting";
import StatusBadge from "../shared/StatusBadge";
import { Skeleton, EmptyState, ErrorState } from "../ui/States";
import useSurfaceMotion from "../../hooks/useSurfaceMotion";
import SaveEventButton from "../events/SaveEventButton";

export function EventPoster({
  event,
  className = "",
  eager = false,
  contain = false,
}: {
  event: { title: string; posterUrl?: string };
  className?: string;
  eager?: boolean;
  contain?: boolean;
}) {
  const [failedUrl, setFailedUrl] = useState("");
  return event.posterUrl && failedUrl !== event.posterUrl ? (
    <img
      src={event.posterUrl}
      alt={`Event poster for ${event.title}`}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailedUrl(event.posterUrl || "")}
      className={`h-full w-full ${contain ? "object-contain" : "object-cover"} ${className}`}
    />
  ) : (
    <div className={`event-poster-fallback ${className}`}>
      <Asterisk size={58} aria-hidden="true" />
      <strong>{event.title}</strong>
      <span>GOOD THINGS ARE COMING</span>
    </div>
  );
}
export function EventLoading({ compact = false }: { compact?: boolean }) {
  return (
    <div role="status" className="event-loading">
      <p className="poppin-eyebrow">Finding your next plan…</p>
      <div className={`poppin-discover-grid ${compact ? "is-compact" : ""}`}>
        {["first", "second", "third"].slice(0, compact ? 2 : 3).map((key) => (
          <Skeleton key={key} className="event-loading-card">
            <div />
            <span />
            <span />
          </Skeleton>
        ))}
      </div>
    </div>
  );
}
export function EventMessage({
  error = false,
  title,
  copy,
  retry,
}: {
  error?: boolean;
  title?: string;
  copy?: string;
  retry?: () => void;
}) {
  return error ? (
    <ErrorState title={title} description={copy} onRetry={retry} />
  ) : (
    <EmptyState
      title={title || "Your next plan is on its way."}
      description={
        copy || "New local events are added all the time. Take a look around."
      }
      action={
        <ActionLink to="/discover" text>
          Explore events
        </ActionLink>
      }
    />
  );
}
export function HeroPosterCollage({
  events,
  loading,
  error,
  retry,
}: {
  events: Event[];
  loading: boolean;
  error: boolean;
  retry: () => void;
}) {
  const [selectedId, setSelectedId] = useState("");
  const posterMotion = useSurfaceMotion<HTMLDivElement>(8);
  const posters = events.filter((event) => event.posterUrl).slice(0, 3);
  const selectedIndex = Math.max(
    0,
    posters.findIndex((event) => event._id === selectedId),
  );
  const selected = posters[selectedIndex];
  function move(direction: number) {
    const next = (selectedIndex + direction + posters.length) % posters.length;
    setSelectedId(posters[next]._id);
  }
  if (loading)
    return (
      <div className="hero-poster-stage">
        <EventLoading compact />
      </div>
    );
  if (error)
    return (
      <div className="hero-poster-stage">
        <EventMessage
          error
          title="A quick intermission."
          copy="We couldn't load the latest events. Let's try again."
          retry={retry}
        />
      </div>
    );
  return (
    <section className="hero-poster-stage" aria-label="Event spotlight">
      <div className="spotlight-frame" aria-hidden="true" />
      <span className="spotlight-label">
        <Asterisk size={16} aria-hidden="true" /> THE LOCAL SPOTLIGHT
      </span>
      {selected ? (
        <>
          <div className="spotlight-stack" {...posterMotion}>
            {posters.filter((event) => event._id !== selected._id).map((event, index) => (
              <div className={`spotlight-fan-card spotlight-fan-${index}`} key={event._id} aria-hidden="true">
                <EventPoster event={event} eager contain />
              </div>
            ))}
            <Link
              key={selected._id}
              to={`/events/${selected._id}`}
              className="spotlight-ticket"
              aria-label={`Explore ${selected.title}`}
            >
              <div className="spotlight-poster">
                <EventPoster event={selected} eager contain />
              </div>
              <div className="spotlight-stub">
                <div className="spotlight-date">
                  <span>
                    {eventDate(selected.startDate, { month: "short" })}
                  </span>
                  <strong>
                    {eventDate(selected.startDate, { day: "2-digit" })}
                  </strong>
                </div>
                <div className="spotlight-event">
                  <span>{selected.organizer?.name || "Around Pampanga"}</span>
                  <h2>{selected.title}</h2>
                </div>
                <ArrowUpRight size={22} aria-hidden="true" />
              </div>
            </Link>
            <span className="spotlight-stamp" aria-hidden="true">
              <Asterisk size={35} />
              <span>
                GO
                <br />
                LOCAL.
              </span>
            </span>
          </div>
          {posters.length > 1 && (
            <div className="spotlight-picker" role="group" aria-label="Choose a spotlight event">
              {posters.map((event, index) => (
                <button key={event._id} type="button" aria-pressed={event._id === selected._id}
                  aria-label={`Show ${event.title}`} onClick={() => setSelectedId(event._id)}>
                  <span className="spotlight-picker-number">{String(index + 1).padStart(2, "0")}</span>
                  <span className="spotlight-picker-title">{event.organizer?.name || event.title}</span>
                  <span className="spotlight-picker-dot" aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
          <div className="spotlight-controls">
            <span aria-live="polite" aria-atomic="true">
              <strong>{String(selectedIndex + 1).padStart(2, "0")}</strong> /{" "}
              {String(posters.length).padStart(2, "0")}
              <span className="sr-only">: {selected.title}</span>
            </span>
            <span className="spotlight-hint">A little out of the ordinary.</span>
            <div className="spotlight-arrows">
              <button
                type="button"
                aria-label="Previous spotlight event"
                disabled={posters.length < 2}
                onClick={() => move(-1)}
              >
                <ArrowLeft size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Next spotlight event"
                disabled={posters.length < 2}
                onClick={() => move(1)}
              >
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="hero-placeholder">
          <Ticket size={66} aria-hidden="true" />
          <h2>
            Something good
            <br />
            is coming.
          </h2>
          <p>New local plans will land right here.</p>
        </div>
      )}
    </section>
  );
}
export function EditorialEventCard({
  event,
  large = false,
  variant = "standard",
  onRemoved,
}: {
  event: Event;
  large?: boolean;
  variant?: "standard" | "compact" | "featured" | "social";
  onRemoved?: () => void;
}) {
  const motion = useSurfaceMotion<HTMLElement>();
  return (
    <article
      {...motion}
      className={`event-card interactive-surface poppin-event-${variant} ${large ? "event-card-large" : ""}`}
    >
      <Link to={`/events/${event._id}`} className="event-card-link">
        <div className="event-card-media">
          <EventPoster event={event} contain />
          <div className="event-card-date">
            <span>{eventDate(event.startDate, { month: "short" })}</span>
            <strong>{eventDate(event.startDate, { day: "2-digit" })}</strong>
          </div>
          <span className="event-card-open" aria-hidden="true">
            <ArrowUpRight size={21} />
          </span>
        </div>
        <div className="event-card-content">
          <div className="event-card-topline">
            <span>{event.categories?.[0]?.name || "Local event"}</span>
            <StatusBadge status={eventStatus(event)} />
          </div>
          <h3>{event.title}</h3>
          <p>
            <MapPin size={14} aria-hidden="true" />
            {eventLocation(event)}
          </p>
          <div className="event-card-bottom">
            <span>{event.organizer?.name || "Local organizer"}</span>
            <span>
              View event <ArrowUpRight size={13} aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
      <div className="event-card-save">
        <SaveEventButton event={event} onRemoved={onRemoved} />
      </div>
    </article>
  );
}
