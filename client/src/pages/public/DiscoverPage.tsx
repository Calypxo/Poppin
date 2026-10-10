import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  ChevronDown,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import api from "../../api/client";
import Button from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/FormControls";
import {
  EditorialEventCard,
  EventLoading,
  EventMessage,
} from "../../components/home/EventPresentation";
import type { DiscoverEventsResponse, Event } from "../../types/event";
import { PageContainer, PageHeader } from "../../components/layout/Page";
import { EmptyState } from "../../components/ui/States";
import { discoveryApiQuery } from "../../utils/discoveryQuery";

const filterLabels: Record<string, string> = {
  search: "Search",
  city: "City",
  category: "Category",
  from: "From",
  to: "Until",
  state: "Timing",
  featured: "Featured",
};

export default function DiscoverPage() {
  const [params, setParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const query = params.toString();
  const activeFilters = [...params.entries()].filter(
    ([key, value]) => filterLabels[key] && value,
  );
  const advancedFilterCount = [
    "city",
    "category",
    "from",
    "to",
    "state",
  ].filter((key) => params.get(key)).length;

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        setError("");
        const response = await api.get<DiscoverEventsResponse>(
          "/events/discover?" + discoveryApiQuery(query),
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
    <PageContainer className="poppin-discovery-page">
      <PageHeader
        eyebrow="GO WHERE THE GOOD THINGS ARE"
        title="Your next great find."
        featured
        motif="camera-reference"
        description="Markets, pop-ups and unexpected favorites. Find something worth stepping out for in Pampanga."
      />
      <form
        className="poppin-filter-panel"
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
        <div className="poppin-search-row">
          <div className="poppin-search-field">
            <label htmlFor="discover-search">Find your kind of event</label>
            <div className="poppin-search-input">
              <Search size={21} aria-hidden="true" />
              <Input
                id="discover-search"
                name="search"
                defaultValue={params.get("search") || ""}
                placeholder="Coffee, vintage finds, weekend markets…"
              />
            </div>
          </div>
          <Button
            type="submit"
            icon={<ArrowUpRight size={18} aria-hidden="true" />}
          >
            Find events
          </Button>
        </div>
        <details
          className="poppin-advanced-filters"
          open={advancedFilterCount > 0}
        >
          <summary className="poppin-filter-caption">
            <SlidersHorizontal size={16} aria-hidden="true" />
            <span>Refine your search</span>
            {advancedFilterCount > 0 && (
              <span className="poppin-filter-applied-count">
                {advancedFilterCount} applied
              </span>
            )}
            <ChevronDown
              className="poppin-filter-chevron"
              size={16}
              aria-hidden="true"
            />
          </summary>
          <div className="poppin-filter-fields">
            <div>
              <label htmlFor="discover-city">City or location</label>
              <Input
                id="discover-city"
                name="city"
                defaultValue={params.get("city") || ""}
                placeholder="Anywhere in Pampanga"
              />
            </div>
            <div>
              <label htmlFor="discover-category">Category</label>
              <Input
                id="discover-category"
                name="category"
                defaultValue={params.get("category") || ""}
                placeholder="Fashion, food, art…"
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
              <label htmlFor="discover-to">Until date</label>
              <Input
                id="discover-to"
                type="date"
                name="to"
                defaultValue={params.get("to") || ""}
              />
            </div>
            <div>
              <label htmlFor="discover-state">Event timing</label>
              <Select
                id="discover-state"
                name="state"
                defaultValue={params.get("state") || ""}
              >
                <option value="">Any time</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Happening now</option>
                <option value="completed">Past events</option>
              </Select>
            </div>
          </div>
        </details>
      </form>
      {activeFilters.length > 0 && (
        <div className="poppin-active-filters" aria-label="Applied filters">
          {activeFilters.map(([key, value]) => (
            <button
              type="button"
              key={key}
              onClick={() =>
                setParams((current) => {
                  const next = new URLSearchParams(current);
                  next.delete(key);
                  return next;
                })
              }
              aria-label={"Remove " + filterLabels[key] + " filter: " + value}
            >
              <span>
                {filterLabels[key]}: {value}
              </span>
              <X size={13} aria-hidden="true" />
            </button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => setParams({})}>
            Clear filters
          </Button>
        </div>
      )}
      <div className="poppin-results-heading">
        <div>
          <p className="poppin-eyebrow">THE LOCAL EDIT</p>
          <h2>
            {query ? "Made for your plans" : "Out there. Waiting for you."}
          </h2>
        </div>
        {!loading && !error && (
          <p className="poppin-results-count" role="status">
            {events.length} {events.length === 1 ? "event" : "events"}
          </p>
        )}
      </div>
      {loading ? (
        <EventLoading />
      ) : error ? (
        <EventMessage
          error
          title={error}
          retry={() => setRetry((value) => value + 1)}
        />
      ) : !events.length ? (
        <EmptyState
          title="A different plan could be the one."
          description="No events match these filters. Try a different date, city or category."
          action={
            <Button variant="outline" onClick={() => setParams({})}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="poppin-discover-grid">
          {events.map((event) => (
            <EditorialEventCard key={event._id} event={event} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
