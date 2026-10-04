import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

import api from "../../api/client";

import type {
  Event,
  Organizer,
} from "../../types/event";

import type { AdminAnalytics } from "../../types/analytics";

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] =
    useState<AdminAnalytics | null>(null);

  const [events, setEvents] =
    useState<Event[]>([]);

  const [organizers, setOrganizers] =
    useState<Organizer[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [actionMessage, setActionMessage] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  const [
    processingEventId,
    setProcessingEventId,
  ] = useState("");

  const [
    processingOrganizerId,
    setProcessingOrganizerId,
  ] = useState("");

  // ----------------------------------------------------
  // LOAD DASHBOARD DATA
  // ----------------------------------------------------
  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [
        analyticsResponse,
        eventsResponse,
        organizersResponse,
      ] = await Promise.all([
        api.get<AdminAnalytics>(
          "/analytics/overview"
        ),

        api.get<Event[]>(
          "/events"
        ),

        api.get<Organizer[]>(
          "/organizers"
        ),
      ]);

      setAnalytics(
        analyticsResponse.data
      );

      setEvents(
        eventsResponse.data
      );

      setOrganizers(
        organizersResponse.data
      );
    } catch (err) {
      console.error(
        "Failed to load admin dashboard:",
        err
      );

      setError(
        "Unable to load admin dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  // ----------------------------------------------------
  // PENDING EVENTS
  // ----------------------------------------------------
  const pendingEvents =
    useMemo(() => {
      return events.filter(
        (event) =>
          event.status === "pending"
      );
    }, [events]);

  // ----------------------------------------------------
  // PENDING ORGANIZERS
  // ----------------------------------------------------
  const pendingOrganizers =
    useMemo(() => {
      return organizers.filter(
        (organizer) =>
          organizer.status === "pending"
      );
    }, [organizers]);

  // ----------------------------------------------------
  // PUBLISH EVENT
  // ----------------------------------------------------
  async function publishEvent(
    eventId: string
  ) {
    const confirmed =
      window.confirm(
        "Publish this event?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingEventId(eventId);
      setActionMessage("");
      setActionError("");

      await api.patch(
        `/events/${eventId}/status`,
        {
          status: "published",
        }
      );

      setActionMessage(
        "Event published successfully."
      );

      await loadDashboard();
    } catch (err) {
      console.error(
        "Failed to publish event:",
        err
      );

      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message ||
            "Unable to publish event."
        );
      } else {
        setActionError(
          "Unable to publish event."
        );
      }
    } finally {
      setProcessingEventId("");
    }
  }

  // ----------------------------------------------------
  // REJECT EVENT
  // ----------------------------------------------------
  async function rejectEvent(
    eventId: string
  ) {
    const reason =
      window.prompt(
        "Enter the reason for rejecting this event:"
      );

    if (reason === null) {
      return;
    }

    if (!reason.trim()) {
      setActionError(
        "A rejection reason is required."
      );

      return;
    }

    try {
      setProcessingEventId(eventId);
      setActionMessage("");
      setActionError("");

      await api.patch(
        `/events/${eventId}/status`,
        {
          status: "rejected",
          rejectionReason:
            reason.trim(),
        }
      );

      setActionMessage(
        "Event rejected successfully."
      );

      await loadDashboard();
    } catch (err) {
      console.error(
        "Failed to reject event:",
        err
      );

      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message ||
            "Unable to reject event."
        );
      } else {
        setActionError(
          "Unable to reject event."
        );
      }
    } finally {
      setProcessingEventId("");
    }
  }

  // ----------------------------------------------------
  // VERIFY ORGANIZER
  // ----------------------------------------------------
  async function verifyOrganizer(
    organizerId: string
  ) {
    const confirmed =
      window.confirm(
        "Verify this organizer?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingOrganizerId(
        organizerId
      );

      setActionMessage("");
      setActionError("");

      await api.patch(
        `/organizers/${organizerId}/status`,
        {
          status: "verified",
        }
      );

      setActionMessage(
        "Organizer verified successfully."
      );

      await loadDashboard();
    } catch (err) {
      console.error(
        "Failed to verify organizer:",
        err
      );

      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message ||
            "Unable to verify organizer."
        );
      } else {
        setActionError(
          "Unable to verify organizer."
        );
      }
    } finally {
      setProcessingOrganizerId("");
    }
  }

  // ----------------------------------------------------
  // REJECT ORGANIZER
  // ----------------------------------------------------
  async function rejectOrganizer(
    organizerId: string
  ) {
    const reason =
      window.prompt(
        "Enter the reason for rejecting this organizer:"
      );

    if (reason === null) {
      return;
    }

    if (!reason.trim()) {
      setActionError(
        "A rejection reason is required."
      );

      return;
    }

    try {
      setProcessingOrganizerId(
        organizerId
      );

      setActionMessage("");
      setActionError("");

      await api.patch(
        `/organizers/${organizerId}/status`,
        {
          status: "rejected",
          rejectionReason:
            reason.trim(),
        }
      );

      setActionMessage(
        "Organizer rejected successfully."
      );

      await loadDashboard();
    } catch (err) {
      console.error(
        "Failed to reject organizer:",
        err
      );

      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message ||
            "Unable to reject organizer."
        );
      } else {
        setActionError(
          "Unable to reject organizer."
        );
      }
    } finally {
      setProcessingOrganizerId("");
    }
  }

  // ----------------------------------------------------
  // LOADING
  // ----------------------------------------------------
  if (loading) {
    return (
      <main style={pageStyle}>
        <p>
          Loading admin dashboard...
        </p>
      </main>
    );
  }

  // ----------------------------------------------------
  // ERROR
  // ----------------------------------------------------
  if (error) {
    return (
      <main style={pageStyle}>
        <h1>
          Admin Dashboard
        </h1>

        <p>{error}</p>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      {/* HEADER */}
      <header>
        <h1>
          Popp'in Admin Dashboard
        </h1>

        <p>
          Manage organizers, event
          approvals, and platform
          activity.
        </p>

        {/* NEW MANAGEMENT LINK */}
        <Link
          to="/admin/manage"
          style={{
            display: "inline-block",
            marginTop: "10px",
          }}
        >
          Manage Venues & Categories
        </Link>
      </header>

      {/* PLATFORM OVERVIEW */}
      {analytics && (
        <>
          <section
            style={{
              marginTop: "32px",
            }}
          >
            <h2>
              Platform Overview
            </h2>

            <div style={cardGridStyle}>
              <DashboardCard
                title="Organizers"
                value={
                  analytics.totals
                    .organizers
                }
              />

              <DashboardCard
                title="Verified Organizers"
                value={
                  analytics.totals
                    .verifiedOrganizers
                }
              />

              <DashboardCard
                title="Total Events"
                value={
                  analytics.totals
                    .events
                }
              />

              <DashboardCard
                title="Venues"
                value={
                  analytics.totals
                    .venues
                }
              />

              <DashboardCard
                title="Vendor Calls"
                value={
                  analytics.totals
                    .vendorCalls
                }
              />

              <DashboardCard
                title="Vendor Applications"
                value={
                  analytics.totals
                    .vendorApplications
                }
              />
            </div>
          </section>

          {/* EVENT OVERVIEW */}
          <section
            style={{
              marginTop: "42px",
            }}
          >
            <h2>
              Event Overview
            </h2>

            <div style={cardGridStyle}>
              <DashboardCard
                title="Draft"
                value={
                  analytics.events.draft
                }
              />

              <DashboardCard
                title="Pending Review"
                value={
                  analytics.events
                    .pending
                }
              />

              <DashboardCard
                title="Published"
                value={
                  analytics.events
                    .published
                }
              />

              <DashboardCard
                title="Rejected"
                value={
                  analytics.events
                    .rejected
                }
              />

              <DashboardCard
                title="Cancelled"
                value={
                  analytics.events
                    .cancelled
                }
              />

              <DashboardCard
                title="Upcoming"
                value={
                  analytics.events
                    .upcoming
                }
              />
            </div>
          </section>

          {/* VENDOR OVERVIEW */}
          <section
            style={{
              marginTop: "42px",
            }}
          >
            <h2>
              Vendor Overview
            </h2>

            <div style={cardGridStyle}>
              <DashboardCard
                title="Pending Applications"
                value={
                  analytics
                    .vendorApplications
                    .pending
                }
              />

              <DashboardCard
                title="Approved Vendors"
                value={
                  analytics
                    .vendorApplications
                    .approved
                }
              />

              <DashboardCard
                title="Rejected Vendors"
                value={
                  analytics
                    .vendorApplications
                    .rejected
                }
              />

              <DashboardCard
                title="Approval Rate"
                value={`${analytics.vendorApplications.approvalRate}%`}
              />

              <DashboardCard
                title="Vendor Slots"
                value={
                  analytics.vendorSlots
                    .total
                }
              />

              <DashboardCard
                title="Available Slots"
                value={
                  analytics.vendorSlots
                    .available
                }
              />
            </div>
          </section>
        </>
      )}

      {/* ACTION MESSAGES */}
      {actionMessage && (
        <div style={successStyle}>
          {actionMessage}
        </div>
      )}

      {actionError && (
        <div style={errorStyle}>
          {actionError}
        </div>
      )}

      {/* ORGANIZER REVIEWS */}
      <section
        style={{
          marginTop: "50px",
        }}
      >
        <h2>
          Organizers Pending Verification
        </h2>

        <p>
          Review organizer information
          before allowing their events
          to be published.
        </p>

        {pendingOrganizers.length ===
        0 ? (
          <EmptyState>
            No organizers are currently
            waiting for verification.
          </EmptyState>
        ) : (
          <div style={listStyle}>
            {pendingOrganizers.map(
              (organizer) => {
                const isProcessing =
                  processingOrganizerId ===
                  organizer._id;

                return (
                  <article
                    key={organizer._id}
                    style={itemCardStyle}
                  >
                    <h3>
                      {organizer.name}
                    </h3>

                    <p>
                      {
                        organizer.description
                      }
                    </p>

                    <p>
                      <strong>
                        Email:
                      </strong>{" "}
                      {organizer.email}
                    </p>

                    <p>
                      <strong>
                        Contact:
                      </strong>{" "}
                      {
                        organizer.contactNumber
                      }
                    </p>

                    <p>
                      <strong>
                        City:
                      </strong>{" "}
                      {organizer.city}
                    </p>

                    {organizer.socialMedia && (
                      <p>
                        <strong>
                          Social Media:
                        </strong>{" "}
                        {
                          organizer.socialMedia
                        }
                      </p>
                    )}

                    <p>
                      <strong>
                        Status:
                      </strong>{" "}
                      {organizer.status}
                    </p>

                    <div style={actionStyle}>
                      <button
                        type="button"
                        disabled={
                          isProcessing
                        }
                        onClick={() =>
                          verifyOrganizer(
                            organizer._id
                          )
                        }
                      >
                        {isProcessing
                          ? "Processing..."
                          : "Verify Organizer"}
                      </button>

                      <button
                        type="button"
                        disabled={
                          isProcessing
                        }
                        onClick={() =>
                          rejectOrganizer(
                            organizer._id
                          )
                        }
                      >
                        Reject Organizer
                      </button>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>

      {/* EVENT REVIEWS */}
      <section
        style={{
          marginTop: "50px",
          marginBottom: "80px",
        }}
      >
        <h2>
          Events Pending Review
        </h2>

        <p>
          Review events submitted by
          organizers before they become
          visible to the public.
        </p>

        {pendingEvents.length ===
        0 ? (
          <EmptyState>
            No events are currently
            waiting for review.
          </EmptyState>
        ) : (
          <div style={listStyle}>
            {pendingEvents.map(
              (event) => {
                const isProcessing =
                  processingEventId ===
                  event._id;

                return (
                  <article
                    key={event._id}
                    style={itemCardStyle}
                  >
                    <h3>
                      {event.title}
                    </h3>

                    <p>
                      {event.description}
                    </p>

                    <p>
                      <strong>
                        Organizer:
                      </strong>{" "}
                      {
                        event.organizer
                          ?.name
                      }
                    </p>

                    <p>
                      <strong>
                        Organizer Status:
                      </strong>{" "}
                      {
                        event.organizer
                          ?.status
                      }
                    </p>

                    <p>
                      <strong>
                        Venue:
                      </strong>{" "}
                      {event.venue?.name}
                    </p>

                    <p>
                      <strong>
                        Location:
                      </strong>{" "}
                      {event.venue?.city},{" "}
                      {
                        event.venue
                          ?.province
                      }
                    </p>

                    <p>
                      <strong>
                        Start Date:
                      </strong>{" "}
                      {new Date(
                        event.startDate
                      ).toLocaleDateString()}
                    </p>

                    <p>
                      <strong>
                        End Date:
                      </strong>{" "}
                      {new Date(
                        event.endDate
                      ).toLocaleDateString()}
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

                    {event.posterUrl && (
                      <img
                        src={
                          event.posterUrl
                        }
                        alt={event.title}
                        style={{
                          width: "100%",
                          maxWidth:
                            "450px",
                          maxHeight:
                            "280px",
                          objectFit:
                            "cover",
                          borderRadius:
                            "10px",
                          marginTop:
                            "18px",
                        }}
                      />
                    )}

                    <div style={actionStyle}>
                      <button
                        type="button"
                        disabled={
                          isProcessing
                        }
                        onClick={() =>
                          publishEvent(
                            event._id
                          )
                        }
                      >
                        {isProcessing
                          ? "Processing..."
                          : "Publish Event"}
                      </button>

                      <button
                        type="button"
                        disabled={
                          isProcessing
                        }
                        onClick={() =>
                          rejectEvent(
                            event._id
                          )
                        }
                      >
                        Reject Event
                      </button>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>
    </main>
  );
}

// ------------------------------------------------------
// DASHBOARD CARD
// ------------------------------------------------------
function DashboardCard({
  title,
  value,
}: {
  title: string;
  value: number | string;
}) {
  return (
    <article style={dashboardCardStyle}>
      <p
        style={{
          margin: 0,
        }}
      >
        {title}
      </p>

      <strong
        style={{
          display: "block",
          fontSize: "28px",
          marginTop: "10px",
        }}
      >
        {value}
      </strong>
    </article>
  );
}

// ------------------------------------------------------
// EMPTY STATE
// ------------------------------------------------------
function EmptyState({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        marginTop: "20px",
        padding: "24px",
        background: "white",
        border: "1px solid #ddd",
        borderRadius: "12px",
      }}
    >
      <p
        style={{
          margin: 0,
        }}
      >
        {children}
      </p>
    </div>
  );
}

// ------------------------------------------------------
// STYLES
// ------------------------------------------------------
const pageStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "40px 24px",
};

const cardGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "16px",
  marginTop: "18px",
};

const dashboardCardStyle: React.CSSProperties = {
  padding: "20px",
  background: "white",
  border: "1px solid #ddd",
  borderRadius: "14px",
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: "20px",
  marginTop: "24px",
};

const itemCardStyle: React.CSSProperties = {
  padding: "24px",
  background: "white",
  border: "1px solid #ddd",
  borderRadius: "14px",
};

const actionStyle: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "24px",
};

const successStyle: React.CSSProperties = {
  marginTop: "32px",
  padding: "15px",
  background: "#f1fff3",
  border: "1px solid #b7d8ba",
  borderRadius: "10px",
};

const errorStyle: React.CSSProperties = {
  marginTop: "32px",
  padding: "15px",
  background: "#fff4f4",
  border: "1px solid #e0b4b4",
  borderRadius: "10px",
};