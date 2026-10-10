import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Clock3, MapPin, MoveUpRight, Ticket } from "lucide-react";
import { WatercolorSticker } from "../public/MarketDecorations";
import type { Event } from "../../types/event";
import Button from "../ui/Button";
import { EmptyState, ErrorState, LoadingState } from "../ui/States";
import { ActionLink, Reveal } from "../public/PublicPrimitives";
import { EventPoster } from "./EventPresentation";
import { eventDate, eventLocation } from "./eventFormatting";
import { calendarHours, localDateKey } from "./weeklyCalendar";
import { weekendSelection, type WeekendPeriod } from "./weekendSelection";

const periods: { value: WeekendPeriod; label: string }[] = [
  { value: "this-weekend", label: "This weekend" },
  { value: "next-weekend", label: "Next weekend" },
  { value: "upcoming", label: "Coming up" },
];

function WeekendTicket({ event }: { event: Event }) {
  const multipleDays = localDateKey(event.startDate) !== localDateKey(event.endDate);
  return (
    <li className="weekend-ticket">
      <Link to={`/events/${event._id}`} className="weekend-ticket-link" aria-label={`View ${event.title}`}>
        <div className="weekend-ticket-date" aria-hidden="true">
          <span>{eventDate(event.startDate, { month: "short" })}</span>
          <strong>{eventDate(event.startDate, { day: "2-digit" })}</strong>
          <span>{eventDate(event.startDate, { weekday: "short" })}</span>
        </div>
        <div className="weekend-ticket-poster"><EventPoster event={event} contain /></div>
        <div className="weekend-ticket-copy">
          <span className="weekend-ticket-category">{event.categories?.[0]?.name || "Local event"}</span>
          <h3>{event.title}</h3>
          <p><MapPin size={13} aria-hidden="true" />{eventLocation(event)}</p>
          <p className="weekend-ticket-time">
            <Clock3 size={13} aria-hidden="true" />
            <span>
              <time dateTime={event.startDate}>{eventDate(event.startDate)}</time>
              {multipleDays && <> – <time dateTime={event.endDate}>{eventDate(event.endDate)}</time></>}
              <span className="weekend-time-separator"> · </span>{calendarHours(event)}
            </span>
          </p>
        </div>
        <span className="weekend-ticket-arrow" aria-hidden="true"><ArrowUpRight size={20} /></span>
      </Link>
    </li>
  );
}

export default function WeekendEdit({ events, loading, error, retry }: {
  events: Event[];
  loading: boolean;
  error: boolean;
  retry: () => void;
}) {
  const [period, setPeriod] = useState<WeekendPeriod>("this-weekend");
  const resultsId = useId();
  const selection = weekendSelection(events, period);
  const preview = selection.events.slice(0, 3);

  return (
    <section className="weekend-edit" id="this-week" aria-labelledby="weekend-edit-title">
      <div className="poppin-container">
        <Reveal className="weekend-edit-layout">
          <div className="weekend-edit-intro">
            <span className="poppin-eyebrow">02 / THE WEEKEND EDIT</span>
            <h2 id="weekend-edit-title">Less scrolling.<br />More <span>going out.</span></h2>
            <p>A few good reasons to leave the group chat and meet somewhere local.</p>
            <div className="weekend-edit-art" aria-hidden="true">
              <div className="weekend-mini-ticket">
                <span>YOUR NEXT GOOD DAY</span>
                <div><Ticket size={26} /><strong>Starts here.</strong></div>
                <span>PAMPANGA, PH <MoveUpRight size={15} /></span>
              </div>
              <WatercolorSticker motif="matcha-latte" className="weekend-edit-drink" />
              <WatercolorSticker motif="croissant" className="weekend-edit-pastry" />
            </div>
            <span className="weekend-edit-footnote"><span /> Local plans. Real connections.</span>
          </div>
          <div className="weekend-edit-plans">
            <div className="weekend-periods" role="group" aria-label="Choose when to go">
              {periods.map(({ value, label }) => (
                <Button key={value} size="sm" variant={period === value ? "primary" : "ghost"}
                  aria-pressed={period === value} aria-controls={resultsId} onClick={() => setPeriod(value)}>
                  {label}
                </Button>
              ))}
            </div>
            <div id={resultsId} className="weekend-results" aria-busy={loading}>
              <div className="weekend-results-heading" role="status" aria-live="polite" aria-atomic="true">
                <span>{selection.range}</span>
                {!loading && !error && <span>{selection.events.length} {selection.events.length === 1 ? "event" : "events"}</span>}
              </div>
              {loading ? <LoadingState label="Finding local plans…" compact />
                : error ? <ErrorState title="Plans are taking a moment." description="We couldn't load the events. Give it another try." onRetry={retry} />
                : preview.length ? (
                  <ol key={period} className="weekend-ticket-list" aria-label={`${periods.find((item) => item.value === period)?.label} events`}>
                    {preview.map((event) => <WeekendTicket key={event._id} event={event} />)}
                  </ol>
                ) : <EmptyState
                  title={period === "upcoming" ? "Good things take a little planning." : "An open weekend, for now."}
                  description={period === "upcoming" ? "New local events will appear here when they're announced." : "Nothing listed for these dates yet. Take a peek at what's coming next."}
                  action={period === "upcoming" ? <ActionLink to="/discover" text>Explore all events</ActionLink> :
                    <Button variant="outline" onClick={() => setPeriod("upcoming")}>See what's coming up <ArrowUpRight size={16} aria-hidden="true" /></Button>}
                />}
            </div>
            {!loading && !error && preview.length > 0 && <div className="weekend-edit-bottom">
              <span>{selection.events.length > 3 ? `A first look at ${preview.length} of ${selection.events.length} events.` : "Found your kind of plan?"}</span>
              <ActionLink to={selection.discoverUrl} text>See all {period === "upcoming" ? "upcoming events" : "weekend events"}</ActionLink>
            </div>}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
