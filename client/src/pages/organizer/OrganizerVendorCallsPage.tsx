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

import type {
  Category,
  Event,
} from "../../types/event";

import type {
  VendorCall,
} from "../../types/vendorCall";

import {
  vendorCallSchema,
  type VendorCallFormInput,
  type VendorCallFormData,
} from "../../schemas/vendorCallSchema";

export default function OrganizerVendorCallsPage() {
  const [searchParams] =
    useSearchParams();

  const organizerId =
    searchParams.get("organizerId") || "";

  const [events, setEvents] =
    useState<Event[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [vendorCalls, setVendorCalls] =
    useState<VendorCall[]>([]);

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
  } = useForm<
        VendorCallFormInput,
        any,
        VendorCallFormData
        >({
        resolver: zodResolver(
            vendorCallSchema
        ),

    defaultValues: {
      event: "",
      title: "",
      description: "",
      applicationStartDate: "",
      applicationDeadline: "",
      totalSlots: 1,
      boothFee: 0,
      boothSize: "",
      requirements: "",
      acceptedCategories: [],
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
        categoryResponse,
        vendorCallResponse,
      ] = await Promise.all([
        api.get<Event[]>("/events"),

        api.get<Category[]>(
          "/categories"
        ),

        api.get<VendorCall[]>(
          "/vendor-calls"
        ),
      ]);

      setEvents(eventResponse.data);
      setCategories(
        categoryResponse.data
      );
      setVendorCalls(
        vendorCallResponse.data
      );
    } catch (err) {
      console.error(
        "Failed to load vendor call management:",
        err
      );

      setPageError(
        "Unable to load vendor calls."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // ----------------------------------------------------
  // EVENTS OWNED BY THIS ORGANIZER
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
  // VENDOR CALLS OWNED BY THIS ORGANIZER
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
  // FORMAT DATE
  // ----------------------------------------------------
  function formatDateForInput(
    value: string
  ) {
    return new Date(value)
      .toISOString()
      .split("T")[0];
  }

  // ----------------------------------------------------
  // EDIT
  // ----------------------------------------------------
  function startEditing(
    vendorCall: VendorCall
  ) {
    setEditingId(vendorCall._id);

    reset({
      event:
        vendorCall.event?._id || "",

      title:
        vendorCall.title,

      description:
        vendorCall.description,

      applicationStartDate:
        formatDateForInput(
          vendorCall.applicationStartDate
        ),

      applicationDeadline:
        formatDateForInput(
          vendorCall.applicationDeadline
        ),

      totalSlots:
        vendorCall.totalSlots,

      boothFee:
        vendorCall.boothFee,

      boothSize:
        vendorCall.boothSize || "",

      requirements:
        vendorCall.requirements?.join(
          ", "
        ) || "",

      acceptedCategories:
        vendorCall.acceptedCategories?.map(
          (category) =>
            category._id
        ) || [],
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
      description: "",
      applicationStartDate: "",
      applicationDeadline: "",
      totalSlots: 1,
      boothFee: 0,
      boothSize: "",
      requirements: "",
      acceptedCategories: [],
    });
  }

  // ----------------------------------------------------
  // SAVE
  // ----------------------------------------------------
  async function saveVendorCall(
    data: VendorCallFormData,
    status: "draft" | "open"
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
          "You can only create a vendor call for your own event."
        );

        return;
      }

      if (
        status === "open" &&
        selectedEvent.status !==
          "published"
      ) {
        setActionError(
          "The event must be published before opening vendor applications."
        );

        return;
      }

      const requirements =
        data.requirements
          ? data.requirements
              .split(",")
              .map((item) =>
                item.trim()
              )
              .filter(Boolean)
          : [];

      const payload = {
        event: data.event,
        title: data.title,
        description:
          data.description,

        applicationStartDate:
          data.applicationStartDate,

        applicationDeadline:
          data.applicationDeadline,

        totalSlots:
          data.totalSlots,

        boothFee:
          data.boothFee,

        boothSize:
          data.boothSize || "",

        requirements,

        acceptedCategories:
          data.acceptedCategories,

        status,

        isActive: true,
      };

      if (editingId) {
        await api.patch(
          `/vendor-calls/${editingId}`,
          payload
        );

        setMessage(
          status === "open"
            ? "Vendor call updated and opened successfully."
            : "Vendor call updated successfully."
        );
      } else {
        await api.post(
          "/vendor-calls",
          payload
        );

        setMessage(
          status === "open"
            ? "Vendor call created and opened successfully."
            : "Vendor call saved as draft."
        );
      }

      resetForm();

      await loadData();
    } catch (err) {
      console.error(
        "Failed to save vendor call:",
        err
      );

      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message ||
            "Unable to save vendor call."
        );
      } else {
        setActionError(
          "Unable to save vendor call."
        );
      }
    }
  }

  // ----------------------------------------------------
  // DELETE
  // ----------------------------------------------------
  async function deleteVendorCall(
    vendorCall: VendorCall
  ) {
    const confirmed =
      window.confirm(
        `Delete vendor call "${vendorCall.title}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setActionError("");

      await api.delete(
        `/vendor-calls/${vendorCall._id}`
      );

      setMessage(
        "Vendor call deleted successfully."
      );

      if (
        editingId === vendorCall._id
      ) {
        resetForm();
      }

      await loadData();
    } catch (err) {
      console.error(
        "Failed to delete vendor call:",
        err
      );

      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message ||
            "Unable to delete vendor call."
        );
      } else {
        setActionError(
          "Unable to delete vendor call."
        );
      }
    }
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <p>
          Loading vendor calls...
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
          Vendor Call Management
        </h1>

        <p>
          Create and manage vendor
          application opportunities for
          your events.
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

      {/* FORM */}
      <form
        style={formStyle}
        onSubmit={(event) =>
          event.preventDefault()
        }
      >
        <h2>
          {editingId
            ? "Edit Vendor Call"
            : "Create Vendor Call"}
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
                  {event.title} (
                  {event.status})
                </option>
              )
            )}
          </select>
        </Field>

        {/* TITLE */}
        <Field
          label="Vendor Call Title"
          error={
            errors.title?.message
          }
        >
          <input
            {...register("title")}
            style={inputStyle}
          />
        </Field>

        {/* DESCRIPTION */}
        <Field
          label="Description"
          error={
            errors.description
              ?.message
          }
        >
          <textarea
            rows={5}
            {...register(
              "description"
            )}
            style={inputStyle}
          />
        </Field>

        {/* DATES */}
        <Field
          label="Application Opening Date"
          error={
            errors
              .applicationStartDate
              ?.message
          }
        >
          <input
            type="date"
            {...register(
              "applicationStartDate"
            )}
            style={inputStyle}
          />
        </Field>

        <Field
          label="Application Deadline"
          error={
            errors
              .applicationDeadline
              ?.message
          }
        >
          <input
            type="date"
            {...register(
              "applicationDeadline"
            )}
            style={inputStyle}
          />
        </Field>

        {/* SLOTS */}
        <Field
          label="Total Vendor Slots"
          error={
            errors.totalSlots?.message
          }
        >
          <input
            type="number"
            min="1"
            {...register(
              "totalSlots"
            )}
            style={inputStyle}
          />
        </Field>

        {/* FEE */}
        <Field
          label="Booth Fee"
          error={
            errors.boothFee?.message
          }
        >
          <input
            type="number"
            min="0"
            {...register(
              "boothFee"
            )}
            style={inputStyle}
          />
        </Field>

        {/* BOOTH SIZE */}
        <Field label="Booth Size">
          <input
            placeholder="Example: 2m x 2m"
            {...register(
              "boothSize"
            )}
            style={inputStyle}
          />
        </Field>

        {/* REQUIREMENTS */}
        <Field label="Requirements">
          <textarea
            rows={4}
            placeholder="Separate each requirement with a comma"
            {...register(
              "requirements"
            )}
            style={inputStyle}
          />

          <small>
            Example: Business name,
            product list, social media
            page
          </small>
        </Field>

        {/* ACCEPTED CATEGORIES */}
        <Field
          label="Accepted Categories"
          error={
            errors
              .acceptedCategories
              ?.message
          }
        >
          <div
            style={{
              display: "grid",
              gap: "8px",
            }}
          >
            {categories.map(
              (category) => (
                <label
                  key={category._id}
                >
                  <input
                    type="checkbox"
                    value={
                      category._id
                    }
                    {...register(
                      "acceptedCategories"
                    )}
                  />{" "}
                  {category.name}
                </label>
              )
            )}
          </div>
        </Field>

        <div style={actionStyle}>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit(
              (data) =>
                saveVendorCall(
                  data,
                  "draft"
                )
            )}
          >
            {editingId
              ? "Save Changes"
              : "Save Draft"}
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit(
              (data) =>
                saveVendorCall(
                  data,
                  "open"
                )
            )}
          >
            Open Vendor Call
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

      {/* EXISTING VENDOR CALLS */}
      <section
        style={{
          marginTop: "50px",
          marginBottom: "80px",
        }}
      >
        <h2>
          My Vendor Calls
        </h2>

        {organizerVendorCalls
          .length === 0 ? (
          <p>
            You have no vendor calls
            yet.
          </p>
        ) : (
          <div style={listStyle}>
            {organizerVendorCalls.map(
              (vendorCall) => (
                <article
                  key={
                    vendorCall._id
                  }
                  style={cardStyle}
                >
                  <h3>
                    {vendorCall.title}
                  </h3>

                  <p>
                    <strong>
                      Event:
                    </strong>{" "}
                    {
                      vendorCall.event
                        ?.title
                    }
                  </p>

                  <p>
                    {
                      vendorCall.description
                    }
                  </p>

                  <p>
                    <strong>
                      Opens:
                    </strong>{" "}
                    {new Date(
                      vendorCall.applicationStartDate
                    ).toLocaleDateString()}
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
                      Booth Fee:
                    </strong>{" "}
                    ₱
                    {vendorCall.boothFee.toLocaleString()}
                  </p>

                  <p>
                    <strong>
                      Status:
                    </strong>{" "}
                    {
                      vendorCall.status
                    }
                  </p>

                  <div style={actionStyle}>
                    <button
                      type="button"
                      onClick={() =>
                        startEditing(
                          vendorCall
                        )
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteVendorCall(
                          vendorCall
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