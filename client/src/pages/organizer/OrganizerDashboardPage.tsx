import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import axios from "axios";

import api from "../../api/client";

import type {
  Event,
  Organizer,
} from "../../types/event";

import type { VendorCall } from "../../types/vendorCall";

import type { VendorApplicationListItem } from "../../types/vendorApplication";

export default function OrganizerDashboardPage() {
  const [searchParams] =
    useSearchParams();

  const [organizers, setOrganizers] =
    useState<Organizer[]>([]);

  const [events, setEvents] =
    useState<Event[]>([]);

  const [vendorCalls, setVendorCalls] =
    useState<VendorCall[]>([]);

  const [applications, setApplications] =
    useState<VendorApplicationListItem[]>([]);

  const [
    selectedOrganizerId,
    setSelectedOrganizerId,
  ] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  const [actionMessage, setActionMessage] =
    useState("");

  const [
    processingApplicationId,
    setProcessingApplicationId,
  ] = useState("");

  // ----------------------------------------------------
  // LOAD ORGANIZER DASHBOARD DATA
  // ----------------------------------------------------
  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [
          organizersResponse,
          eventsResponse,
          vendorCallsResponse,
          applicationsResponse,
        ] = await Promise.all([
          api.get<Organizer[]>(
            "/organizers"
          ),

          api.get<Event[]>(
            "/events"
          ),

          api.get<VendorCall[]>(
            "/vendor-calls"
          ),

          api.get<
            VendorApplicationListItem[]
          >(
            "/vendor-applications"
          ),
        ]);

        setOrganizers(
          organizersResponse.data
        );

        setEvents(
          eventsResponse.data
        );

        setVendorCalls(
          vendorCallsResponse.data
        );

        setApplications(
          applicationsResponse.data
        );

        if (
          organizersResponse.data.length >
          0
        ) {
          const verifiedOrganizer =
            organizersResponse.data.find(
              (organizer) =>
                organizer.status ===
                "verified"
            );

          const organizerFromUrl =
            searchParams.get(
              "organizerId"
            );

          const organizerExists =
            organizersResponse.data.some(
              (organizer) =>
                organizer._id ===
                organizerFromUrl
            );

          setSelectedOrganizerId(
            organizerExists &&
              organizerFromUrl
              ? organizerFromUrl
              : verifiedOrganizer?._id ||
                  organizersResponse
                    .data[0]._id
          );
        }
      } catch (err) {
        console.error(
          "Failed to load organizer dashboard:",
          err
        );

        setError(
          "Unable to load organizer dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [searchParams]);

  // ----------------------------------------------------
  // APPROVE APPLICATION
  // ----------------------------------------------------
  async function approveApplication(
    applicationId: string
  ) {
    const confirmed =
      window.confirm(
        "Approve this vendor application?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingApplicationId(
        applicationId
      );

      setActionError("");
      setActionMessage("");

      const response = await api.patch(
        `/vendor-applications/${applicationId}/status`,
        {
          status: "approved",
          organizerRemarks:
            "Approved by organizer.",
        }
      );

      const updatedApplication =
        response.data.application;

      setApplications((current) =>
        current.map((application) =>
          application._id ===
          updatedApplication._id
            ? updatedApplication
            : application
        )
      );

      setActionMessage(
        "Vendor application approved successfully."
      );
    } catch (err) {
      console.error(
        "Failed to approve application:",
        err
      );

      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message ||
            "Unable to approve application."
        );
      } else {
        setActionError(
          "Unable to approve application."
        );
      }
    } finally {
      setProcessingApplicationId("");
    }
  }

  // ----------------------------------------------------
  // REJECT APPLICATION
  // ----------------------------------------------------
  async function rejectApplication(
    applicationId: string
  ) {
    const reason = window.prompt(
      "Please enter the reason for rejecting this application:"
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
      setProcessingApplicationId(
        applicationId
      );

      setActionError("");
      setActionMessage("");

      const response = await api.patch(
        `/vendor-applications/${applicationId}/status`,
        {
          status: "rejected",
          organizerRemarks:
            reason.trim(),
        }
      );

      const updatedApplication =
        response.data.application;

      setApplications((current) =>
        current.map((application) =>
          application._id ===
          updatedApplication._id
            ? updatedApplication
            : application
        )
      );

      setActionMessage(
        "Vendor application rejected."
      );
    } catch (err) {
      console.error(
        "Failed to reject application:",
        err
      );

      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message ||
            "Unable to reject application."
        );
      } else {
        setActionError(
          "Unable to reject application."
        );
      }
    } finally {
      setProcessingApplicationId("");
    }
  }

  // ----------------------------------------------------
  // CURRENT ORGANIZER
  // ----------------------------------------------------
  const currentOrganizer =
    useMemo(() => {
      return organizers.find(
        (organizer) =>
          organizer._id ===
          selectedOrganizerId
      );
    }, [
      organizers,
      selectedOrganizerId,
    ]);

  // ----------------------------------------------------
  // EVENTS OWNED BY ORGANIZER
  // ----------------------------------------------------
  const organizerEvents =
    useMemo(() => {
      return events.filter(
        (event) =>
          event.organizer?._id ===
          selectedOrganizerId
      );
    }, [
      events,
      selectedOrganizerId,
    ]);

  // ----------------------------------------------------
  // EVENT IDS
  // ----------------------------------------------------
  const organizerEventIds =
    useMemo(() => {
      return new Set(
        organizerEvents.map(
          (event) => event._id
        )
      );
    }, [organizerEvents]);

  // ----------------------------------------------------
  // VENDOR CALLS OWNED BY ORGANIZER
  // ----------------------------------------------------
  const organizerVendorCalls =
    useMemo(() => {
      return vendorCalls.filter(
        (vendorCall) =>
          organizerEventIds.has(
            vendorCall.event?._id
          )
      );
    }, [
      vendorCalls,
      organizerEventIds,
    ]);

  // ----------------------------------------------------
  // VENDOR CALL IDS
  // ----------------------------------------------------
  const organizerVendorCallIds =
    useMemo(() => {
      return new Set(
        organizerVendorCalls.map(
          (vendorCall) =>
            vendorCall._id
        )
      );
    }, [organizerVendorCalls]);

  // ----------------------------------------------------
  // APPLICATIONS FOR THIS ORGANIZER
  // ----------------------------------------------------
  const organizerApplications =
    useMemo(() => {
      return applications.filter(
        (application) =>
          organizerVendorCallIds.has(
            application.vendorCall?._id
          )
      );
    }, [
      applications,
      organizerVendorCallIds,
    ]);

  // ----------------------------------------------------
  // DASHBOARD COUNTS
  // ----------------------------------------------------
  const publishedEvents =
    organizerEvents.filter(
      (event) =>
        event.status === "published"
    ).length;

  const pendingEvents =
    organizerEvents.filter(
      (event) =>
        event.status === "pending"
    ).length;

  const pendingApplications =
    organizerApplications.filter(
      (application) =>
        application.status ===
        "pending"
    ).length;

  const approvedApplications =
    organizerApplications.filter(
      (application) =>
        application.status ===
        "approved"
    ).length;

  // ----------------------------------------------------
  // LOADING
  // ----------------------------------------------------
  if (loading) {
    return (
      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 24px",
        }}
      >
        <p>
          Loading organizer dashboard...
        </p>
      </main>
    );
  }

  // ----------------------------------------------------
  // ERROR
  // ----------------------------------------------------
  if (error) {
    return (
      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 24px",
        }}
      >
        <h1>
          Organizer Dashboard
        </h1>

        <p>{error}</p>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 24px",
      }}
    >
      {/* HEADER */}
      <header>
        <h1>
          Organizer Dashboard
        </h1>

        <p>
          Manage events, vendor calls,
          announcements, and vendor
          applications.
        </p>

        {/* MAIN ORGANIZER ACTIONS */}
        {selectedOrganizerId && (
          <div
            style={{
              display: "flex",
              gap: "14px",
              flexWrap: "wrap",
              marginTop: "20px",
            }}
          >
            <Link
              to={`/organizer/events/new?organizerId=${selectedOrganizerId}`}
            >
              + Create Event
            </Link>

            <Link
              to={`/organizer/vendor-calls?organizerId=${selectedOrganizerId}`}
            >
              Manage Vendor Calls
            </Link>

            <Link
              to={`/organizer/announcements?organizerId=${selectedOrganizerId}`}
            >
              Manage Announcements
            </Link>
          </div>
        )}
      </header>

      {/* DEMO ORGANIZER SELECTOR */}
      <section
        style={{
          marginTop: "30px",
          padding: "20px",
          background: "white",
          border: "1px solid #ddd",
          borderRadius: "14px",
        }}
      >
        <label
          htmlFor="organizer"
          style={{
            display: "block",
            fontWeight: 600,
            marginBottom: "8px",
          }}
        >
          Viewing as Organizer
        </label>

        <select
          id="organizer"
          value={
            selectedOrganizerId
          }
          onChange={(event) => {
            setSelectedOrganizerId(
              event.target.value
            );

            setActionMessage("");
            setActionError("");
          }}
          style={{
            width: "100%",
            maxWidth: "420px",
            padding: "12px",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        >
          {organizers.map(
            (organizer) => (
              <option
                key={organizer._id}
                value={organizer._id}
              >
                {organizer.name}
              </option>
            )
          )}
        </select>

        {currentOrganizer && (
          <div
            style={{
              marginTop: "16px",
            }}
          >
            <strong>
              {currentOrganizer.name}
            </strong>

            <p>
              {currentOrganizer.city}
            </p>

            <p>
              Status:{" "}
              {currentOrganizer.status}
            </p>
          </div>
        )}
      </section>

      {/* SUMMARY CARDS */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginTop: "30px",
        }}
      >
        <DashboardCard
          title="Total Events"
          value={
            organizerEvents.length
          }
        />

        <DashboardCard
          title="Published"
          value={publishedEvents}
        />

        <DashboardCard
          title="Pending Review"
          value={pendingEvents}
        />

        <DashboardCard
          title="Vendor Calls"
          value={
            organizerVendorCalls.length
          }
        />

        <DashboardCard
          title="Pending Applications"
          value={
            pendingApplications
          }
        />

        <DashboardCard
          title="Approved Vendors"
          value={
            approvedApplications
          }
        />
      </section>

      {/* EVENTS */}
      <section
        style={{
          marginTop: "40px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <h2>My Events</h2>

          {selectedOrganizerId && (
            <Link
              to={`/organizer/events/new?organizerId=${selectedOrganizerId}`}
            >
              + Create Event
            </Link>
          )}
        </div>

        {organizerEvents.length ===
        0 ? (
          <p>
            This organizer has no
            events yet.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "16px",
            }}
          >
            {organizerEvents.map(
              (event) => (
                <article
                  key={event._id}
                  style={{
                    padding: "20px",
                    background:
                      "white",
                    border:
                      "1px solid #ddd",
                    borderRadius:
                      "12px",
                  }}
                >
                  <h3>
                    {event.title}
                  </h3>

                  <p>
                    <strong>
                      Status:
                    </strong>{" "}
                    {event.status}
                  </p>

                  <p>
                    <strong>
                      Date:
                    </strong>{" "}
                    {new Date(
                      event.startDate
                    ).toLocaleDateString()}
                  </p>

                  <p>
                    <strong>
                      Venue:
                    </strong>{" "}
                    {
                      event.venue
                        ?.name
                    }
                  </p>

                  {event.rejectionReason && (
                    <p>
                      <strong>
                        Rejection Reason:
                      </strong>{" "}
                      {
                        event.rejectionReason
                      }
                    </p>
                  )}

                  <Link
                    to={`/organizer/events/${event._id}/edit?organizerId=${selectedOrganizerId}`}
                  >
                    Edit Event
                  </Link>
                </article>
              )
            )}
          </div>
        )}
      </section>

      {/* VENDOR CALLS */}
      <section
        style={{
          marginTop: "40px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <h2>
            Vendor Calls
          </h2>

          {selectedOrganizerId && (
            <Link
              to={`/organizer/vendor-calls?organizerId=${selectedOrganizerId}`}
            >
              Manage Vendor Calls
            </Link>
          )}
        </div>

        {organizerVendorCalls
          .length === 0 ? (
          <p>
            No vendor calls found.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "16px",
            }}
          >
            {organizerVendorCalls.map(
              (vendorCall) => (
                <article
                  key={
                    vendorCall._id
                  }
                  style={{
                    padding: "20px",
                    background:
                      "white",
                    border:
                      "1px solid #ddd",
                    borderRadius:
                      "12px",
                  }}
                >
                  <h3>
                    {
                      vendorCall.title
                    }
                  </h3>

                  <p>
                    <strong>
                      Event:
                    </strong>{" "}
                    {
                      vendorCall
                        .event?.title
                    }
                  </p>

                  <p>
                    <strong>
                      Deadline:
                    </strong>{" "}
                    {new Date(
                      vendorCall.applicationDeadline
                    ).toLocaleDateString()}
                  </p>

                  <p>
                    <strong>
                      Slots:
                    </strong>{" "}
                    {
                      vendorCall.totalSlots
                    }
                  </p>

                  <p>
                    <strong>
                      Status:
                    </strong>{" "}
                    {
                      vendorCall.status
                    }
                  </p>

                  <Link
                    to={`/organizer/vendor-calls?organizerId=${selectedOrganizerId}`}
                  >
                    Manage
                  </Link>
                </article>
              )
            )}
          </div>
        )}
      </section>

      {/* VENDOR APPLICATIONS */}
      <section
        style={{
          marginTop: "40px",
          marginBottom: "80px",
        }}
      >
        <h2>
          Vendor Applications
        </h2>

        {actionMessage && (
          <div
            style={{
              marginBottom: "20px",
              padding: "14px",
              background: "#f1fff3",
              border:
                "1px solid #b7d8ba",
              borderRadius: "10px",
            }}
          >
            {actionMessage}
          </div>
        )}

        {actionError && (
          <div
            style={{
              marginBottom: "20px",
              padding: "14px",
              background: "#fff4f4",
              border:
                "1px solid #e0b4b4",
              borderRadius: "10px",
            }}
          >
            {actionError}
          </div>
        )}

        {organizerApplications
          .length === 0 ? (
          <p>
            No vendor applications
            found.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "16px",
            }}
          >
            {organizerApplications.map(
              (application) => {
                const isProcessing =
                  processingApplicationId ===
                  application._id;

                return (
                  <article
                    key={
                      application._id
                    }
                    style={{
                      padding: "22px",
                      background:
                        "white",
                      border:
                        "1px solid #ddd",
                      borderRadius:
                        "12px",
                    }}
                  >
                    <h3>
                      {
                        application.businessName
                      }
                    </h3>

                    <p>
                      <strong>
                        Application Code:
                      </strong>{" "}
                      {
                        application.applicationCode
                      }
                    </p>

                    <p>
                      <strong>
                        Representative:
                      </strong>{" "}
                      {
                        application.representativeName
                      }
                    </p>

                    <p>
                      <strong>
                        Email:
                      </strong>{" "}
                      {
                        application.email
                      }
                    </p>

                    <p>
                      <strong>
                        Contact:
                      </strong>{" "}
                      {
                        application.contactNumber
                      }
                    </p>

                    <p>
                      <strong>
                        Category:
                      </strong>{" "}
                      {
                        application
                          .category?.name
                      }
                    </p>

                    <p>
                      <strong>
                        Products:
                      </strong>{" "}
                      {
                        application.products
                      }
                    </p>

                    <p>
                      <strong>
                        Vendor Call:
                      </strong>{" "}
                      {
                        application
                          .vendorCall
                          ?.title
                      }
                    </p>

                    <p>
                      <strong>
                        Status:
                      </strong>{" "}
                      {
                        application.status
                      }
                    </p>

                    {application.organizerRemarks && (
                      <p>
                        <strong>
                          Remarks:
                        </strong>{" "}
                        {
                          application.organizerRemarks
                        }
                      </p>
                    )}

                    {application.status ===
                      "pending" && (
                      <div
                        style={{
                          display:
                            "flex",
                          gap: "10px",
                          marginTop:
                            "18px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <button
                          type="button"
                          disabled={
                            isProcessing
                          }
                          onClick={() =>
                            approveApplication(
                              application._id
                            )
                          }
                          style={{
                            padding:
                              "10px 18px",
                            border:
                              "1px solid #aaa",
                            borderRadius:
                              "8px",
                            cursor:
                              isProcessing
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {isProcessing
                            ? "Processing..."
                            : "Approve"}
                        </button>

                        <button
                          type="button"
                          disabled={
                            isProcessing
                          }
                          onClick={() =>
                            rejectApplication(
                              application._id
                            )
                          }
                          style={{
                            padding:
                              "10px 18px",
                            border:
                              "1px solid #aaa",
                            borderRadius:
                              "8px",
                            cursor:
                              isProcessing
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
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
  value: number;
}) {
  return (
    <article
      style={{
        padding: "20px",
        background: "white",
        border: "1px solid #ddd",
        borderRadius: "14px",
      }}
    >
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
          marginTop: "10px",
          fontSize: "28px",
        }}
      >
        {value}
      </strong>
    </article>
  );
}