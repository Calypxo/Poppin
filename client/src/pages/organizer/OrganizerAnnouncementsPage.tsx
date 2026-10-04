import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  useForm,
} from "react-hook-form";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import axios from "axios";

import api from "../../api/client";

import type { Event } from "../../types/event";

import type { Announcement } from "../../types/announcement";

import {
  announcementSchema,
  type AnnouncementFormData,
} from "../../schemas/announcementSchema";

export default function OrganizerAnnouncementsPage() {
  const [searchParams] =
    useSearchParams();

  const organizerId =
    searchParams.get("organizerId") || "";

  const [events, setEvents] =
    useState<Event[]>([]);

  const [
    announcements,
    setAnnouncements,
  ] = useState<Announcement[]>([]);

  const [editingId, setEditingId] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [pageError, setPageError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(
      announcementSchema
    ),

    defaultValues: {
      event: "",
      title: "",
      content: "",
      type: "general",
    },
  });

  // ----------------------------------------------------
  // LOAD DATA
  // ----------------------------------------------------
  async function loadData() {
    try {
      setLoading(true);
      setPageError("");

      const [
        eventResponse,
        announcementResponse,
      ] = await Promise.all([
        api.get<Event[]>("/events"),

        api.get<Announcement[]>(
          "/announcements"
        ),
      ]);

      setEvents(eventResponse.data);

      setAnnouncements(
        announcementResponse.data
      );
    } catch (err) {
      console.error(
        "Failed to load announcements:",
        err
      );

      setPageError(
        "Unable to load announcements."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // ----------------------------------------------------
  // ORGANIZER EVENTS
  // ----------------------------------------------------
  const organizerEvents =
    useMemo(() => {
      return events.filter(
        (event) =>
          event.organizer?._id ===
          organizerId
      );
    }, [
      events,
      organizerId,
    ]);

  const organizerEventIds =
    useMemo(() => {
      return new Set(
        organizerEvents.map(
          (event) => event._id
        )
      );
    }, [organizerEvents]);

  // ----------------------------------------------------
  // ORGANIZER ANNOUNCEMENTS
  // ----------------------------------------------------
  const organizerAnnouncements =
    useMemo(() => {
      return announcements.filter(
        (announcement) =>
          organizerEventIds.has(
            announcement.event?._id
          )
      );
    }, [
      announcements,
      organizerEventIds,
    ]);

  // ----------------------------------------------------
  // EDIT ANNOUNCEMENT
  // ----------------------------------------------------
  function startEditing(
    announcement: Announcement
  ) {
    setEditingId(
      announcement._id
    );

    reset({
      event:
        announcement.event?._id ||
        "",

      title:
        announcement.title,

      content:
        announcement.content,

      type:
        announcement.type,
    });

    setMessage("");
    setActionError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ----------------------------------------------------
  // RESET FORM
  // ----------------------------------------------------
  function resetForm() {
    setEditingId("");

    reset({
      event: "",
      title: "",
      content: "",
      type: "general",
    });
  }

  // ----------------------------------------------------
  // SAVE / PUBLISH ANNOUNCEMENT
  // ----------------------------------------------------
  async function saveAnnouncement(
    data: AnnouncementFormData,
    publish: boolean
  ) {
    try {
      setMessage("");
      setActionError("");

      const selectedEvent =
        organizerEvents.find(
          (event) =>
            event._id === data.event
        );

      if (!selectedEvent) {
        setActionError(
          "You can only create announcements for your own events."
        );

        return;
      }

      const payload = {
        event: data.event,

        title:
          data.title,

        content:
          data.content,

        type:
          data.type,

        isPublished:
          publish,

        publishedAt:
          publish
            ? new Date()
            : undefined,
      };

      if (editingId) {
        await api.patch(
          `/announcements/${editingId}`,
          payload
        );

        setMessage(
          publish
            ? "Announcement updated and published."
            : "Announcement saved as draft."
        );
      } else {
        await api.post(
          "/announcements",
          payload
        );

        setMessage(
          publish
            ? "Announcement published successfully."
            : "Announcement saved as draft."
        );
      }

      resetForm();

      await loadData();
    } catch (err) {
      console.error(
        "Failed to save announcement:",
        err
      );

      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message ||
            "Unable to save announcement."
        );
      } else {
        setActionError(
          "Unable to save announcement."
        );
      }
    }
  }

  // ----------------------------------------------------
  // DELETE ANNOUNCEMENT
  // ----------------------------------------------------
  async function deleteAnnouncement(
    announcement: Announcement
  ) {
    const confirmed =
      window.confirm(
        `Delete announcement "${announcement.title}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setActionError("");

      await api.delete(
        `/announcements/${announcement._id}`
      );

      setMessage(
        "Announcement deleted successfully."
      );

      if (
        editingId ===
        announcement._id
      ) {
        resetForm();
      }

      await loadData();
    } catch (err) {
      console.error(
        "Failed to delete announcement:",
        err
      );

      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message ||
            "Unable to delete announcement."
        );
      } else {
        setActionError(
          "Unable to delete announcement."
        );
      }
    }
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <p>
          Loading announcements...
        </p>
      </main>
    );
  }

  if (pageError) {
    return (
      <main style={pageStyle}>
        <p>{pageError}</p>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <Link
        to={`/organizer?organizerId=${organizerId}`}
      >
        ← Back to Organizer Dashboard
      </Link>

      <header
        style={{
          marginTop: "28px",
        }}
      >
        <h1>
          Announcement Management
        </h1>

        <p>
          Create updates and notices
          for your events.
        </p>
      </header>

      {message && (
        <div style={successStyle}>
          {message}
        </div>
      )}

      {actionError && (
        <div style={errorStyle}>
          {actionError}
        </div>
      )}

      {/* ANNOUNCEMENT FORM */}
      <form
        style={formStyle}
        onSubmit={(event) =>
          event.preventDefault()
        }
      >
        <h2>
          {editingId
            ? "Edit Announcement"
            : "Create Announcement"}
        </h2>

        {/* EVENT */}
        <Field
          label="Event"
          error={
            errors.event?.message
          }
        >
          <select
            {...register("event")}
            style={inputStyle}
          >
            <option value="">
              Select event
            </option>

            {organizerEvents.map(
              (event) => (
                <option
                  key={event._id}
                  value={event._id}
                >
                  {event.title}
                </option>
              )
            )}
          </select>
        </Field>

        {/* TYPE */}
        <Field
          label="Announcement Type"
          error={
            errors.type?.message
          }
        >
          <select
            {...register("type")}
            style={inputStyle}
          >
            <option value="general">
              General
            </option>

            <option value="schedule_update">
              Schedule Update
            </option>

            <option value="reminder">
              Reminder
            </option>

            <option value="important">
              Important
            </option>
          </select>
        </Field>

        {/* TITLE */}
        <Field
          label="Title"
          error={
            errors.title?.message
          }
        >
          <input
            {...register("title")}
            style={inputStyle}
          />
        </Field>

        {/* CONTENT */}
        <Field
          label="Announcement"
          error={
            errors.content
              ?.message
          }
        >
          <textarea
            rows={6}
            {...register(
              "content"
            )}
            style={inputStyle}
          />
        </Field>

        {/* ACTIONS */}
        <div style={actionStyle}>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit(
              (data) =>
                saveAnnouncement(
                  data,
                  false
                )
            )}
          >
            {editingId
              ? "Save as Draft"
              : "Save Draft"}
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit(
              (data) =>
                saveAnnouncement(
                  data,
                  true
                )
            )}
          >
            Publish Announcement
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
            >
              Cancel Editing
            </button>
          )}
        </div>
      </form>

      {/* EXISTING ANNOUNCEMENTS */}
      <section
        style={{
          marginTop: "50px",
          marginBottom: "80px",
        }}
      >
        <h2>
          My Announcements
        </h2>

        {organizerAnnouncements
          .length === 0 ? (
          <p>
            No announcements found.
          </p>
        ) : (
          <div style={listStyle}>
            {organizerAnnouncements.map(
              (announcement) => (
                <article
                  key={
                    announcement._id
                  }
                  style={cardStyle}
                >
                  <h3>
                    {
                      announcement.title
                    }
                  </h3>

                  <p>
                    <strong>
                      Event:
                    </strong>{" "}
                    {
                      announcement.event
                        ?.title
                    }
                  </p>

                  <p>
                    <strong>
                      Type:
                    </strong>{" "}
                    {
                      announcement.type
                    }
                  </p>

                  <p>
                    {
                      announcement.content
                    }
                  </p>

                  <p>
                    <strong>
                      Status:
                    </strong>{" "}
                    {announcement.isPublished
                      ? "Published"
                      : "Draft"}
                  </p>

                    {announcement.isPublished &&
                    announcement.publishedAt && (
                        <p>
                        <strong>
                            Published:
                        </strong>{" "}
                        {new Date(
                            announcement.publishedAt
                        ).toLocaleString()}
                        </p>
                    )}

                  <div style={actionStyle}>
                    <button
                      type="button"
                      onClick={() =>
                        startEditing(
                          announcement
                        )
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteAnnouncement(
                          announcement
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        marginBottom: "22px",
      }}
    >
      <label
        style={{
          display: "block",
          fontWeight: 600,
          marginBottom: "8px",
        }}
      >
        {label}
      </label>

      {children}

      {error && (
        <p
          style={{
            color: "#b42318",
            fontSize: "14px",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  maxWidth: "950px",
  margin: "0 auto",
  padding: "40px 24px",
};

const formStyle: React.CSSProperties = {
  marginTop: "30px",
  padding: "28px",
  background: "white",
  border: "1px solid #ddd",
  borderRadius: "16px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #ccc",
  borderRadius: "8px",
  background: "white",
};

const actionStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "20px",
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: "16px",
  marginTop: "20px",
};

const cardStyle: React.CSSProperties = {
  padding: "22px",
  background: "white",
  border: "1px solid #ddd",
  borderRadius: "14px",
};

const successStyle: React.CSSProperties = {
  marginTop: "22px",
  padding: "14px",
  background: "#f1fff3",
  border: "1px solid #b7d8ba",
  borderRadius: "10px",
};

const errorStyle: React.CSSProperties = {
  marginTop: "22px",
  padding: "14px",
  background: "#fff4f4",
  border: "1px solid #e0b4b4",
  borderRadius: "10px",
};