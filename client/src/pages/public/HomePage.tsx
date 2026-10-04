import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../../api/client";
import type {
  DiscoverEventsResponse,
  Event,
} from "../../types/event";

export default function HomePage() {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchFeaturedEvents() {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get<DiscoverEventsResponse>(
            "/events/discover?featured=true"
          );

        setFeaturedEvents(response.data.events);
      } catch (err) {
        console.error(
          "Failed to load featured events:",
          err
        );

        setError(
          "Unable to load featured events."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedEvents();
  }, []);

  return (
    <main>
      {/* HERO */}
      <section
        style={{
          minHeight: "430px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "40px 24px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "64px",
              margin: 0,
            }}
          >
            Popp'in
          </h1>

          <h2>What's near you?</h2>

          <p>
            Discover pop-ups, bazaars, flea markets,
            and local events around Pampanga.
          </p>

          <Link to="/discover">
            Discover Events
          </Link>
        </div>
      </section>

      {/* FEATURED EVENTS */}
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "40px 24px 80px",
        }}
      >
        <h2>Featured Events</h2>

        <p>
          Check out some of the events happening
          around Pampanga.
        </p>

        {loading && (
          <p>Loading featured events...</p>
        )}

        {error && <p>{error}</p>}

        {!loading &&
          !error &&
          featuredEvents.length === 0 && (
            <p>
              No featured events are available right
              now.
            </p>
          )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
            marginTop: "24px",
          }}
        >
          {!loading &&
            !error &&
            featuredEvents.map((event) => (
              <article
                key={event._id}
                style={{
                  background: "white",
                  border: "1px solid #ddd",
                  borderRadius: "16px",
                  padding: "20px",
                }}
              >
                {event.posterUrl && (
                  <img
                    src={event.posterUrl}
                    alt={event.title}
                    style={{
                      width: "100%",
                      height: "180px",
                      objectFit: "cover",
                      borderRadius: "10px",
                    }}
                  />
                )}

                <h3>{event.title}</h3>

                <p>{event.description}</p>

                <p>
                  <strong>Venue:</strong>{" "}
                  {event.venue?.name}
                </p>

                <p>
                  <strong>Location:</strong>{" "}
                  {event.venue?.city}
                </p>

                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(
                    event.startDate
                  ).toLocaleDateString()}
                </p>

                {event.eventState && (
                  <p>
                    <strong>Status:</strong>{" "}
                    {event.eventState}
                  </p>
                )}

                {event.eventState === "upcoming" &&
                  event.daysUntilStart !==
                    undefined && (
                    <p>
                      {event.daysUntilStart === 0
                        ? "Happening today!"
                        : `${event.daysUntilStart} day(s) to go`}
                    </p>
                  )}

                <Link
                  to={`/events/${event._id}`}
                >
                  View Event
                </Link>
              </article>
            ))}
        </div>

        <div
          style={{
            marginTop: "30px",
          }}
        >
          <Link to="/discover">
            View All Events →
          </Link>
        </div>
      </section>
    </main>
  );
}