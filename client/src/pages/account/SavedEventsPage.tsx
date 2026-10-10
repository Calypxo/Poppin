import { useEffect, useRef } from "react";
import { Bookmark, Trash2 } from "lucide-react";
import { useSavedEvents } from "../../saved-events/context";
import EventCard from "../../components/events/EventCard";
import { PageContainer, PageHeader } from "../../components/layout/Page";
import Button, { ButtonLink } from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";

export default function SavedEventsPage() {
  const { entries, loading, error, reload, remove, pendingIds } = useSavedEvents();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { reload(); }, [reload]);
  const focusList = () => heading.current?.focus();

  return <PageContainer className="poppin-saved-page">
    <PageHeader eyebrow="YOUR NEXT GOOD PLANS" title="Saved Events" motif="flower-bouquet"
      description="Keep the events you love close. Completed and cancelled plans stay here until you remove them."
      actions={<ButtonLink variant="outline" to="/discover">Discover events ↗</ButtonLink>} />
    <h2 ref={heading} tabIndex={-1} className="poppin-saved-summary" aria-live="polite" aria-atomic="true">
      <Bookmark size={20} aria-hidden="true" />
      <span>{loading ? "Your saved plans" : `${entries.length} saved ${entries.length === 1 ? "event" : "events"}`}</span>
    </h2>
    {loading ? <LoadingState label="Gathering your saved events…" />
      : error ? <ErrorState title="Your saved plans need a moment." description={error} onRetry={reload} />
      : !entries.length ? <EmptyState title="Your next good plan starts here." motif="matcha-latte"
        description="Tap Save event on a card or event page. Your picks will be waiting here."
        action={<ButtonLink to="/discover">Find an event</ButtonLink>} />
      : <div className="poppin-discover-grid poppin-saved-grid">
        {entries.map((entry) => entry.event
          ? <EventCard key={entry.eventId} event={entry.event} onRemoved={focusList} />
          : <Card key={entry.eventId} className="poppin-saved-unavailable">
            <span className="poppin-status">Unavailable</span>
            <h3>This event is no longer available.</h3>
            <p>It may have been removed by the organizer. You can clear it from your saved plans.</p>
            <Button variant="outline" size="sm" icon={<Trash2 size={16} aria-hidden="true" />}
              loading={pendingIds.has(entry.eventId)} aria-label="Remove unavailable event from Saved Events"
              onClick={async () => { if (await remove(entry.eventId)) focusList(); }}>Remove event</Button>
          </Card>)}
      </div>}
  </PageContainer>;
}
