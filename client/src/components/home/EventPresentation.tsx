import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import type { Event } from "../../types/event";
import { ActionLink } from "../public/PublicPrimitives";
import { categoryIllustration } from "./categoryIllustration";
import { eventDate, eventLocation, eventStatus } from "./eventFormatting";
import { WatercolorSticker } from "../public/MarketDecorations";
import MarketStillLife from "../public/MarketStillLife";
import StatusBadge from "../shared/StatusBadge";
import { Skeleton, EmptyState, ErrorState } from "../ui/States";

export function EventPoster({
  event,
  className = "",
  eager = false,
  contain = false,
}: {
  event: Event;
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
      onError={() => setFailedUrl(event.posterUrl)}
      className={`h-full w-full ${contain ? "object-contain" : "object-cover"} ${className}`}
    />
  ) : (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-3 bg-sage p-5 text-center text-ink ${className}`}
    >
      <WatercolorSticker
        motif={categoryIllustration(event.categories?.[0]?.name || "market")}
        className="h-24 w-28"
      />
      <span className="font-body text-xl">{event.title}</span>
      <span className="poppin-eyebrow">Poster coming soon</span>
    </div>
  );
}

export function EventLoading({ compact = false }: { compact?: boolean }) {
  return (
    <div role="status" className="py-8">
      <span className="poppin-eyebrow text-ink">
        Gathering the local finds…
      </span>
      <div
        aria-hidden="true"
        className={`mt-5 grid gap-4 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}
      >
        {["first-event", "second-event", "third-event"]
          .slice(0, compact ? 2 : 3)
          .map((placeholder) => (
            <Skeleton
              key={placeholder}
              className="poppin-skeleton border border-olive/15 bg-sage/70 p-4"
            >
              <div className={`${compact ? "h-24" : "h-40"} bg-olive/10`} />
              <div className="mt-4 h-2 w-3/4 bg-olive/15" />
              <div className="mt-3 h-2 w-1/2 bg-olive/10" />
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
      title={title || "Nothing’s popping up here just yet."}
      description={
        copy ||
        "Fresh plans are on their way. Browse all events to see what else is happening."
      }
      action={
        <ActionLink to="/discover" text>
          Browse all events
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
  secondary = false,
}: {
  events: Event[];
  loading: boolean;
  error: boolean;
  retry: () => void;
  secondary?: boolean;
}) {
  const posters = events.filter((event) => event.posterUrl).slice(0, 3);
  return (
    <div
      className={`poppin-collage ${secondary ? "poppin-collage-secondary" : ""}`}
    >
      <div className="poppin-collage-note" aria-hidden="true">
        <span className="poppin-note-label">
          {secondary
            ? "meet you at the market!"
            : "a little out of the ordinary"}
        </span>
      </div>
      {loading ? (
        <div className="poppin-collage-placeholder">
          <EventLoading compact />
        </div>
      ) : error ? (
        <div className="poppin-collage-placeholder">
          <WatercolorSticker
            motif="flower-market-booth"
            className="mx-auto h-24 w-32 sm:h-32 sm:w-40"
          />
          <p role="status" className="mt-4 font-body text-2xl text-ink">
            The noticeboard is taking a breather.
          </p>
          <button
            type="button"
            className="poppin-text-link mx-auto mt-4"
            onClick={retry}
          >
            Try loading events again{" "}
            <ArrowUpRight size={16} aria-hidden="true" />
          </button>
        </div>
      ) : posters.length ? (
        <div
          className={`poppin-poster-stack poppin-poster-count-${posters.length}`}
        >
          {posters.map((event, index) => (
            <Link
              key={event._id}
              to={`/events/${event._id}`}
              className={`poppin-taped-poster poppin-poster-${index + 1}`}
              aria-label={`View ${event.title}`}
            >
              <div className="aspect-[3/4] overflow-hidden bg-sage">
                <EventPoster event={event} eager={!secondary} contain />
              </div>
              <span className="mt-2 block truncate text-[10px] font-semibold uppercase tracking-wider">
                {event.venue?.city || "Pampanga"} · {eventDate(event.startDate)}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="poppin-collage-placeholder">
          <MarketStillLife eager={!secondary} />
          <p className="mt-3 font-body text-2xl text-ink sm:mt-5 sm:text-3xl">
            {events.length ? (
              <>
                Good finds.
                <br />
                Great weekends.
              </>
            ) : (
              <>
                Fresh events are
                <br />
                popping up soon.
              </>
            )}
          </p>
          <p className="mt-2 text-xs leading-6 sm:mt-3">
            {events.length
              ? "A little taste of going local."
              : "A little space for your next local favorite."}
          </p>
        </div>
      )}
      <div aria-hidden="true" className="poppin-location-sticker">
        <WatercolorSticker
          motif="map-pin"
          className="h-7 w-5"
          eager={!secondary}
        />{" "}
        PAMPANGA, PH
      </div>
      {!secondary && (
        <>
          <WatercolorSticker
            motif="croissant"
            className="poppin-collage-croissant"
            eager
          />
          <WatercolorSticker
            motif="bilao"
            className="poppin-collage-bilao"
            eager
          />
          <WatercolorSticker
            motif="leather-shoes"
            className="poppin-collage-shoes"
            eager
          />
        </>
      )}
      {secondary && (
        <WatercolorSticker
          motif="camera-reference"
          className="poppin-collage-camera"
        />
      )}
      <span className="poppin-collage-caption" aria-hidden="true">
        {secondary
          ? "good finds, close to home."
          : "save a little room for the weekend."}
      </span>
    </div>
  );
}

export function EditorialEventCard({
  event,
  large = false,
  variant = "standard",
}: {
  event: Event;
  large?: boolean;
  variant?: "standard" | "compact" | "featured" | "social";
}) {
  const featured = large || variant === "featured";
  return (
    <article
      className={`${featured ? "poppin-feature-large" : "poppin-feature-small"} poppin-event-${variant} ${variant === "standard" || variant === "featured" ? "poppin-event-folder" : ""}`}
    >
      <Link
        to={`/events/${event._id}`}
        className="group block"
        aria-label={`View ${event.title}`}
      >
        <div
          className={`poppin-event-card-frame relative overflow-hidden bg-paper p-3 ${featured ? "aspect-[4/5]" : "aspect-[3/4]"}`}
        >
          <EventPoster
            event={event}
            contain
            className="transition-transform duration-500 motion-safe:group-hover:scale-[1.025]"
          />
        </div>
        <div className="poppin-event-card-copy">
          {(variant === "standard" || variant === "featured") && (
            <span className="poppin-event-file-tab">
              {event.categories?.[0]?.name || "Local event"}
            </span>
          )}
          <div className="mt-4">
            <StatusBadge status={eventStatus(event)} />
          </div>
          <div className="mt-5 flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-wider text-ink">
            <time dateTime={event.startDate}>
              {eventDate(event.startDate, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </time>
            <span className="text-right">
              {event.categories
                ?.slice(0, 2)
                .map((category) => category.name)
                .join(" / ")}
            </span>
          </div>
          <h3
            className={`mt-3 font-body leading-tight transition-colors group-hover:text-ink ${featured ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"}`}
          >
            {event.title}
          </h3>
          <p className="mt-3 text-xs leading-6 text-ink/75">
            {eventLocation(event)}
          </p>
          {featured && (
            <p className="mt-3 line-clamp-2 text-sm leading-7 text-ink/75">
              {event.description}
            </p>
          )}
          <span className="poppin-text-link mt-4 text-xs">
            Make a little plan <ArrowUpRight size={15} aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  );
}
