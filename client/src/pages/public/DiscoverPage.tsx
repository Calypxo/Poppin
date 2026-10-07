import Button from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/FormControls";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/client";
import {
  EditorialEventCard,
  EventLoading,
  EventMessage,
} from "../../components/home/EventPresentation";
import type { DiscoverEventsResponse, Event } from "../../types/event";
import { PageHeader } from "../../components/layout/Page";
import { EmptyState } from "../../components/ui/States";

export default function DiscoverPage() {
  const [params, setParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const query = params.toString();

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        setError("");
        const response = await api.get<DiscoverEventsResponse>(
          `/events/discover?${query}`,
          { signal: controller.signal },
        );
        setEvents(response.data.events);
      } catch {
        if (!controller.signal.aborted)
          setError("Unable to load events. Please try again.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [query, retry]);

  return (
    <main className="poppin-page poppin-home">
      <PageHeader
        eyebrow="Your next local plan"
        title="Discover what’s Popp’in"
        featured
        description="A weekend market, a new favorite, a little adventure close to home. Find your next local plan."
        motif="camera-reference"
      />
      <form
        className="poppin-discover-filters"
        key={query}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const next = new URLSearchParams();
          for (const key of [
            "search",
            "city",
            "category",
            "from",
            "to",
            "state",
          ]) {
            const value = String(data.get(key) || "").trim();
            if (value) next.set(key, value);
          }
          setParams(next);
        }}
      >
        <div>
          <label htmlFor="discover-search">Search events</label>
          <Input
            id="discover-search"
            name="search"
            defaultValue={params.get("search") || ""}
            placeholder="Market, coffee, thrift…"
          />
        </div>
        <div>
          <label htmlFor="discover-city">City</label>
          <Input
            id="discover-city"
            name="city"
            defaultValue={params.get("city") || ""}
            placeholder="Angeles City"
          />
        </div>
        <div>
          <label htmlFor="discover-category">Category</label>
          <Input
            id="discover-category"
            name="category"
            defaultValue={params.get("category") || ""}
            placeholder="Fashion & Thrift"
          />
        </div>
        <div>
          <label htmlFor="discover-from">From date</label>
          <Input
            id="discover-from"
            type="date"
            name="from"
            defaultValue={params.get("from") || ""}
          />
        </div>
        <div>
          <label htmlFor="discover-to">To date</label>
          <Input
            id="discover-to"
            type="date"
            name="to"
            defaultValue={params.get("to") || ""}
          />
        </div>
        <div>
          <label htmlFor="discover-state">When</label>
          <Select
            id="discover-state"
            name="state"
            defaultValue={params.get("state") || ""}
          >
            <option value="">All events</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Past events</option>
          </Select>
        </div>
        <div className="poppin-actions">
          <Button type="submit">Find events</Button>
          {query && (
            <Button
              variant="outline"
              type="button"
              onClick={() => setParams({})}
            >
              Clear filters
            </Button>
          )}
        </div>
      </form>
      {loading ? (
        <EventLoading />
      ) : error ? (
        <EventMessage
          error
          title={error}
          retry={() => setRetry((value) => value + 1)}
        />
      ) : events.length === 0 ? (
        <EmptyState
          title="A new little plan is waiting"
          description="No events match these filters. Try another search or check back for new local plans."
          action={
            <Button variant="outline" onClick={() => setParams({})}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <p role="status">
            {events.length} {events.length === 1 ? "event" : "events"} to
            explore
          </p>
          <div className="poppin-discover-grid">
            {events.map((event) => (
              <EditorialEventCard key={event._id} event={event} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
