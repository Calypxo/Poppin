import { useId, useState } from "react";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { Event } from "../../types/event";
import { organizerHighlights } from "../../data/organizerHighlights";
import { ActionLink } from "../public/PublicPrimitives";
import ImagePreview from "../shared/ImagePreview";
import { ButtonLink } from "../ui/Button";

export default function OrganizerHighlights({ events = [], home = false }: { events?: Event[]; home?: boolean }) {
  const [organizer, setOrganizer] = useState("");
  const headingId = useId();
  const listId = useId();
  const organizers = [...new Set(organizerHighlights.map(item => item.organizer))];
  const highlights = organizerHighlights.filter(item => !organizer || item.organizer === organizer);
  return (
    <section className={`organizer-highlights ${home ? "poppin-container home-organizer-highlights" : ""}`}
      aria-labelledby={headingId}>
      <div className="organizer-highlights-heading">
        <div>
          <p className="poppin-eyebrow">A PEEK AT THE LOCAL SCENE</p>
          <h2 id={headingId}>Real places. Good people.</h2>
          <p>Posters, pop-ups and market moments from the people who bring Pampanga together.</p>
        </div>
        {home && <ActionLink to="/feed" text>Explore organizer updates</ActionLink>}
      </div>
      {!home && <div className="organizer-highlight-filters" role="group" aria-label="Filter community highlights by organizer">
        {["", ...organizers].map(value => <button key={value} type="button"
          aria-pressed={organizer === value} aria-controls={listId} onClick={() => setOrganizer(value)}>
          {value || "All organizers"}
        </button>)}
      </div>}
      {!home && <p className="sr-only" role="status" aria-live="polite">{highlights.length} community highlights{organizer ? ` from ${organizer}` : ""}</p>}
      <ul className="organizer-highlight-grid" id={listId}>
        {highlights.map(item => {
          const event = events.find(event => event.status === "published"
            && event.organizer?.name.toLowerCase() === item.organizer.toLowerCase()
            && item.eventTitles.some(title => title.toLowerCase() === event.title.toLowerCase()));
          const source = item.source && <a className="organizer-source-link" href={item.source.url}
            target="_blank" rel="noreferrer">{item.source.label}<ArrowUpRight size={14} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>;
          const footer = source || event ? <>{source}{event && <ButtonLink to={`/events/${event._id}`} size="sm">View event <ArrowUpRight size={15} aria-hidden="true" /></ButtonLink>}</> : undefined;
          return <li className={`organizer-highlight-card ${item.kind === "Market moment" ? "is-photo" : "is-poster"}`} key={item.id}>
            <div className="organizer-highlight-identity"><span className="organizer-highlight-avatar" aria-hidden="true">{item.organizer.replace(/^The /, "").slice(0, 1)}</span>
              <span title={item.organizer}>{item.organizer}</span>
            </div>
            <ImagePreview src={item.image} alt={item.imageAlt} title={item.title} description={item.description}
              fit={item.kind === "Market moment" ? "cover" : "contain"} footer={footer} />
            <div className="organizer-highlight-copy">
              <h3 title={item.title}>{item.title}</h3>
              <p className="organizer-highlight-location"><MapPin size={13} aria-hidden="true" /><span title={item.location}>{item.location}</span></p>
              <div className="organizer-highlight-footer">
                {item.source && <a className="organizer-source-link" href={item.source.url} target="_blank" rel="noreferrer"
                  aria-label={`Photo credit: ${item.source.label} (opens in a new tab)`}>Photo credit <ArrowUpRight size={13} aria-hidden="true" /></a>}
                {event ? <ButtonLink to={`/events/${event._id}`} variant="ghost" size="sm">View event <ArrowUpRight size={15} aria-hidden="true" /></ButtonLink>
                  : <span className="organizer-highlight-kind">{item.kind}</span>}
              </div>
            </div>
          </li>;
        })}
      </ul>
      <p className="organizer-highlights-note">A collection of community highlights. Open a poster for its details; check the organizer's latest update before making a plan.</p>
    </section>
  );
}
