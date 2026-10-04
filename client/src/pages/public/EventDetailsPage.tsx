import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import axios from "axios";

import api from "../../api/client";

import type {
  Event,
} from "../../types/event";

import type {
  VendorCall,
  VendorCallAvailability,
} from "../../types/vendorCall";

import type {
  Announcement,
} from "../../types/announcement";

export default function EventDetailsPage() {
  const { id } = useParams();

  const [event, setEvent] =
    useState<Event | null>(null);

  const [
    vendorCall,
    setVendorCall,
  ] =
    useState<VendorCall | null>(
      null
    );

  const [
    availability,
    setAvailability,
  ] =
    useState<VendorCallAvailability | null>(
      null
    );

  const [
    announcements,
    setAnnouncements,
  ] =
    useState<Announcement[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ----------------------------------------------------
  // LOAD EVENT DETAILS
  // ----------------------------------------------------
  useEffect(() => {
    async function loadEvent() {
      if (!id) {
        setError(
          "Event ID is missing."
        );

        setLoading(false);

        return;
      }

      try {
        setLoading(true);
        setError("");

        // ----------------------------------------------
        // LOAD EVENT
        // ----------------------------------------------
        const eventResponse =
            await api.get<Event>(
                `/events/public/${id}`
            );

        setEvent(
          eventResponse.data
        );

        // ----------------------------------------------
        // LOAD PUBLISHED ANNOUNCEMENTS
        // ----------------------------------------------
        try {
          const announcementResponse =
            await api.get<
              Announcement[]
            >(
              `/announcements/event/${id}`
            );

          setAnnouncements(
            announcementResponse.data
          );
        } catch (
          announcementError
        ) {
          console.error(
            "Unable to load announcements:",
            announcementError
          );

          setAnnouncements([]);
        }

        // ----------------------------------------------
        // LOAD EVENT VENDOR CALL
        // ----------------------------------------------
        try {
          const vendorCallResponse =
            await api.get<VendorCall>(
              `/vendor-calls/event/${id}`
            );

          const call =
            vendorCallResponse.data;

          setVendorCall(call);

          // --------------------------------------------
          // LOAD VENDOR CALL AVAILABILITY
          // --------------------------------------------
          const availabilityResponse =
            await api.get<VendorCallAvailability>(
              `/vendor-calls/${call._id}/availability`
            );

          setAvailability(
            availabilityResponse.data
          );
        } catch (
          vendorCallError
        ) {
          // No vendor call is okay.
          if (
            axios.isAxiosError(
              vendorCallError
            ) &&
            vendorCallError.response
              ?.status === 404
          ) {
            setVendorCall(null);
            setAvailability(null);
          } else {
            console.error(
              "Unable to load vendor call:",
              vendorCallError
            );
          }
        }
      } catch (err) {
        console.error(
          "Failed to load event:",
          err
        );

        if (
          axios.isAxiosError(err)
        ) {
          setError(
            err.response?.data
              ?.message ||
              "Unable to load event."
          );
        } else {
          setError(
            "Unable to load event."
          );
        }
      } finally {
        setLoading(false);
      }
    }

    loadEvent();
  }, [id]);

  // ----------------------------------------------------
  // FORMAT ANNOUNCEMENT TYPE
  // ----------------------------------------------------
  function formatAnnouncementType(
    type: Announcement["type"]
  ) {
    switch (type) {
      case "schedule_update":
        return "Schedule Update";

      case "reminder":
        return "Reminder";

      case "important":
        return "Important";

      default:
        return "General";
    }
  }

  // ----------------------------------------------------
  // LOADING
  // ----------------------------------------------------
  if (loading) {
    return (
      <main style={pageStyle}>
        <p>
          Loading event details...
        </p>
      </main>
    );
  }

  // ----------------------------------------------------
  // ERROR
  // ----------------------------------------------------
  if (error || !event) {
    return (
      <main style={pageStyle}>
        <Link to="/discover">
          ← Back to Discover
        </Link>

        <h1>
          Event Details
        </h1>

        <p>
          {error ||
            "Event not found."}
        </p>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <Link to="/discover">
        ← Back to Discover
      </Link>

      {/* EVENT HEADER */}
      <section
        style={{
          marginTop: "28px",
        }}
      >
        {event.posterUrl && (
          <img
            src={event.posterUrl}
            alt={event.title}
            style={{
              width: "100%",
              maxHeight: "430px",
              objectFit: "cover",
              borderRadius: "16px",
              marginBottom: "28px",
            }}
          />
        )}

        <p>
          {event.eventState
            ? event.eventState
                .charAt(0)
                .toUpperCase() +
              event.eventState.slice(
                1
              )
            : event.status}
        </p>

        <h1>
          {event.title}
        </h1>

        <p>
          {event.description}
        </p>
      </section>

      {/* EVENT INFORMATION */}
      <section style={cardStyle}>
        <h2>
          Event Information
        </h2>

        <p>
          <strong>
            Organizer:
          </strong>{" "}
          {event.organizer?.name}
        </p>

        <p>
          <strong>
            Venue:
          </strong>{" "}
          {event.venue?.name}
        </p>

        <p>
          <strong>
            Address:
          </strong>{" "}
          {event.venue?.address}
        </p>

        <p>
          <strong>
            Location:
          </strong>{" "}
          {event.venue?.city},{" "}
          {event.venue?.province}
        </p>

        <p>
          <strong>
            Date:
          </strong>{" "}
          {new Date(
            event.startDate
          ).toLocaleDateString()}

          {event.startDate !==
            event.endDate && (
            <>
              {" "}
              -{" "}
              {new Date(
                event.endDate
              ).toLocaleDateString()}
            </>
          )}
        </p>

        <p>
          <strong>
            Time:
          </strong>{" "}
          {event.startTime} -{" "}
          {event.endTime}
        </p>

        <p>
          <strong>
            Categories:
          </strong>{" "}
          {event.categories
            ?.map(
              (category) =>
                category.name
            )
            .join(", ")}
        </p>
      </section>

      {/* ANNOUNCEMENTS */}
      <section
        style={{
          marginTop: "40px",
        }}
      >
        <h2>
          Event Updates
        </h2>

        <p>
          Latest announcements from
          the event organizer.
        </p>

        {announcements.length ===
        0 ? (
          <div style={cardStyle}>
            <p
              style={{
                margin: 0,
              }}
            >
              No announcements have
              been posted for this
              event yet.
            </p>
          </div>
        ) : (
          <div style={listStyle}>
            {announcements.map(
              (announcement) => (
                <article
                  key={
                    announcement._id
                  }
                  style={cardStyle}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      gap: "10px",
                      alignItems:
                        "center",
                      flexWrap:
                        "wrap",
                      marginBottom:
                        "10px",
                    }}
                  >
                    <strong>
                      {formatAnnouncementType(
                        announcement.type
                      )}
                    </strong>

                    {announcement.publishedAt && (
                      <span>
                        {new Date(
                          announcement.publishedAt
                        ).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <h3>
                    {
                      announcement.title
                    }
                  </h3>

                  <p>
                    {
                      announcement.content
                    }
                  </p>
                </article>
              )
            )}
          </div>
        )}
      </section>

      {/* VENDOR CALL */}
      {vendorCall && (
        <section
          style={{
            ...cardStyle,
            marginTop: "40px",
          }}
        >
          <h2>
            Vendor Opportunity
          </h2>

          <h3>
            {vendorCall.title}
          </h3>

          <p>
            {
              vendorCall.description
            }
          </p>

          <p>
            <strong>
              Application Deadline:
            </strong>{" "}
            {new Date(
              vendorCall.applicationDeadline
            ).toLocaleDateString()}
          </p>

          <p>
            <strong>
              Booth Fee:
            </strong>{" "}
            ₱
            {vendorCall.boothFee.toLocaleString()}
          </p>

          {vendorCall.boothSize && (
            <p>
              <strong>
                Booth Size:
              </strong>{" "}
              {
                vendorCall.boothSize
              }
            </p>
          )}

          {vendorCall.requirements &&
            vendorCall.requirements
              .length > 0 && (
              <div>
                <strong>
                  Requirements:
                </strong>

                <ul>
                  {vendorCall.requirements.map(
                    (
                      requirement,
                      index
                    ) => (
                      <li
                        key={`${requirement}-${index}`}
                      >
                        {
                          requirement
                        }
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

          {availability && (
            <>
              <p>
                <strong>
                  Applications:
                </strong>{" "}
                {
                  availability
                    .statistics
                    .totalApplications
                }
              </p>

              <p>
                <strong>
                  Slots Remaining:
                </strong>{" "}
                {
                  availability
                    .statistics
                    .slotsRemaining
                }
              </p>

              <p>
                <strong>
                  Status:
                </strong>{" "}
                {
                  availability
                    .availability
                    .status
                }
              </p>

              {availability
                .availability
                .canApply ? (
                <Link
                  to={`/vendor-application/${vendorCall._id}`}
                  style={{
                    display:
                      "inline-block",
                    marginTop:
                      "12px",
                  }}
                >
                  Apply as Vendor
                </Link>
              ) : (
                <p>
                  Vendor applications
                  are currently
                  unavailable.
                </p>
              )}
            </>
          )}
        </section>
      )}

      {/* TRACK APPLICATION */}
      <section
        style={{
          marginTop: "40px",
          marginBottom: "80px",
        }}
      >
        <h2>
          Already Applied?
        </h2>

        <p>
          Check the current status of
          your vendor application.
        </p>

        <Link to="/track-application">
          Track Your Application
        </Link>
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  maxWidth: "950px",
  margin: "0 auto",
  padding: "40px 24px",
};

const cardStyle: React.CSSProperties = {
  marginTop: "20px",
  padding: "24px",
  background: "white",
  border: "1px solid #ddd",
  borderRadius: "14px",
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: "16px",
  marginTop: "20px",
};