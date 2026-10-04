import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../../api/client";
import type {
  DiscoverEventsResponse,
  Event,
} from "../../types/event";

export default function DiscoverPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get<DiscoverEventsResponse>(
            "/events/discover"
          );

        setEvents(response.data.events);
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load events. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <main>
        <h1>Discover Events</h1>
        <p>Loading events...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <h1>Discover Events</h1>
        <p>{error}</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Discover Events</h1>

      <p>
        Find pop-ups, bazaars, flea markets, and
        local events around Pampanga.
      </p>

      {events.length === 0 ? (
        <p>No events are available right now.</p>
      ) : (
        <div>
          {events.map((event) => (
            <article key={event._id}>
              <h2>{event.title}</h2>

              <p>{event.description}</p>

              <p>
                <strong>Organizer:</strong>{" "}
                {event.organizer?.name}
              </p>

              <p>
                <strong>Venue:</strong>{" "}
                {event.venue?.name}
              </p>

              <p>
                <strong>Location:</strong>{" "}
                {event.venue?.city},{" "}
                {event.venue?.province}
              </p>

              <p>
                <strong>Date:</strong>{" "}
                {new Date(
                  event.startDate
                ).toLocaleDateString()}
              </p>

              <p>
                <strong>Time:</strong>{" "}
                {event.startTime} - {event.endTime}
              </p>

              <p>
                <strong>Categories:</strong>{" "}
                {event.categories
                  ?.map((category) => category.name)
                  .join(", ")}
              </p>

              {event.eventState && (
                <p>
                  <strong>Status:</strong>{" "}
                  {event.eventState}
                </p>
              )}

              {event.eventState === "upcoming" &&
                event.daysUntilStart !== undefined && (
                  <p>
                    {event.daysUntilStart === 0
                      ? "Happening today!"
                      : `${event.daysUntilStart} day(s) to go`}
                  </p>
                )}

              <Link to={`/events/${event._id}`}>
                View Event
              </Link>

              <hr />
            </article>
          ))}
        </div>
      )}
    </main>
  );
}