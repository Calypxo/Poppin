import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";

import api from "../../api/client";

import {
  uploadImage,
} from "../../services/uploadService";

import type {
  Category,
  Event,
  Venue,
} from "../../types/event";

import {
  eventSchema,
  type EventFormData,
} from "../../schemas/eventSchema";

export default function OrganizerEventFormPage() {
  const navigate =
    useNavigate();

  const { eventId } =
    useParams();

  const [searchParams] =
    useSearchParams();

  const organizerId =
    searchParams.get(
      "organizerId"
    ) || "";

  const isEditing =
    Boolean(eventId);

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [venues, setVenues] =
    useState<Venue[]>([]);

  const [
    categories,
    setCategories,
  ] =
    useState<Category[]>([]);

  const [
    currentEvent,
    setCurrentEvent,
  ] =
    useState<Event | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [
    pageError,
    setPageError,
  ] =
    useState("");

  const [
    submitError,
    setSubmitError,
  ] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState("");

  const [
    posterError,
    setPosterError,
  ] =
    useState("");

  const [
    uploadingPoster,
    setUploadingPoster,
  ] =
    useState(false);

  const [action, setAction] =
    useState<
      "save" | "submit"
    >("save");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<EventFormData>({
    resolver:
      zodResolver(
        eventSchema
      ),

    defaultValues: {
      title: "",
      description: "",
      venue: "",
      categories: [],
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      posterUrl: "",
    },
  });

  const posterUrl =
    watch("posterUrl");

  // ----------------------------------------------------
  // FORMAT DATE FOR HTML DATE INPUT
  // ----------------------------------------------------
  function formatDateForInput(
    dateValue: string
  ) {
    return new Date(
      dateValue
    )
      .toISOString()
      .split("T")[0];
  }

  // ----------------------------------------------------
  // LOAD VENUES, CATEGORIES, EVENT
  // ----------------------------------------------------
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setPageError("");

        const [
          venueResponse,
          categoryResponse,
        ] =
          await Promise.all([
            api.get<Venue[]>(
              "/venues"
            ),

            api.get<Category[]>(
              "/categories"
            ),
          ]);

        setVenues(
          venueResponse.data
        );

        setCategories(
          categoryResponse.data
        );

        if (eventId) {
          const eventResponse =
            await api.get<Event>(
              `/events/${eventId}`
            );

          const event =
            eventResponse.data;

          setCurrentEvent(
            event
          );

          reset({
            title:
              event.title,

            description:
              event.description,

            venue:
              event.venue
                ?._id || "",

            categories:
              event.categories?.map(
                (category) =>
                  category._id
              ) || [],

            startDate:
              formatDateForInput(
                event.startDate
              ),

            endDate:
              formatDateForInput(
                event.endDate
              ),

            startTime:
              event.startTime,

            endTime:
              event.endTime,

            posterUrl:
              event.posterUrl ||
              "",
          });
        }
      } catch (err) {
        console.error(
          "Failed to load event form:",
          err
        );

        setPageError(
          "Unable to load event form."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [
    eventId,
    reset,
  ]);

  // ----------------------------------------------------
  // SELECT AND UPLOAD POSTER
  // ----------------------------------------------------
  async function handlePosterChange(
    event:
      React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setPosterError("");
    setSubmitError("");
    setSuccessMessage("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setPosterError(
        "Only JPG, PNG, and WEBP images are allowed."
      );

      event.target.value =
        "";

      return;
    }

    const maxFileSize =
      10 * 1024 * 1024;

    if (
      file.size >
      maxFileSize
    ) {
      setPosterError(
        "Image must be 10 MB or smaller."
      );

      event.target.value =
        "";

      return;
    }

    try {
      setUploadingPoster(
        true
      );

      const result =
        await uploadImage(
          file
        );

      setValue(
        "posterUrl",
        result.secureUrl,
        {
          shouldDirty:
            true,

          shouldValidate:
            true,
        }
      );

      setSuccessMessage(
        "Event poster uploaded successfully."
      );
    } catch (err) {
      console.error(
        "Poster upload failed:",
        err
      );

      if (
        axios.isAxiosError(
          err
        )
      ) {
        setPosterError(
          err.response?.data
            ?.message ||
            "Unable to upload event poster."
        );
      } else {
        setPosterError(
          "Unable to upload event poster."
        );
      }
    } finally {
      setUploadingPoster(
        false
      );

      event.target.value =
        "";
    }
  }

  // ----------------------------------------------------
  // REMOVE POSTER
  // ----------------------------------------------------
  function removePoster() {
    setValue(
      "posterUrl",
      "",
      {
        shouldDirty:
          true,

        shouldValidate:
          true,
      }
    );

    setPosterError("");
    setSuccessMessage(
      "Poster removed from this event."
    );

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        "";
    }
  }

  // ----------------------------------------------------
  // SAVE / SUBMIT EVENT
  // ----------------------------------------------------
  async function onSubmit(
    data: EventFormData
  ) {
    if (!organizerId) {
      setSubmitError(
        "Organizer is missing."
      );

      return;
    }

    if (
      uploadingPoster
    ) {
      setSubmitError(
        "Please wait for the poster upload to finish."
      );

      return;
    }

    try {
      setSubmitError("");
      setSuccessMessage("");

      const payload = {
        title:
          data.title,

        description:
          data.description,

        organizer:
          organizerId,

        venue:
          data.venue,

        categories:
          data.categories,

        startDate:
          data.startDate,

        endDate:
          data.endDate,

        startTime:
          data.startTime,

        endTime:
          data.endTime,

        posterUrl:
          data.posterUrl ||
          "",
      };

      let savedEvent:
        Event;

      // ----------------------------------------------
      // EDIT EVENT
      // ----------------------------------------------
      if (eventId) {
        const response =
          await api.patch<Event>(
            `/events/${eventId}`,
            payload
          );

        savedEvent =
          response.data;
      }

      // ----------------------------------------------
      // CREATE EVENT
      // ----------------------------------------------
      else {
        const response =
          await api.post<Event>(
            "/events",
            payload
          );

        savedEvent =
          response.data;
      }

      // ----------------------------------------------
      // SUBMIT FOR ADMIN REVIEW
      // ----------------------------------------------
      if (
        action ===
        "submit"
      ) {
        await api.patch(
          `/events/${savedEvent._id}/status`,
          {
            status:
              "pending",
          }
        );

        setSuccessMessage(
          "Event submitted for admin review."
        );
      } else {
        if (
          isEditing &&
          currentEvent?.status ===
            "published"
        ) {
          setSuccessMessage(
            "Event updated and sent back for admin review."
          );
        } else {
          setSuccessMessage(
            isEditing
              ? "Event updated successfully."
              : "Event saved as draft."
          );
        }
      }

      setTimeout(() => {
        navigate(
          `/organizer?organizerId=${organizerId}`
        );
      }, 700);
    } catch (err) {
      console.error(
        "Failed to save event:",
        err
      );

      if (
        axios.isAxiosError(
          err
        )
      ) {
        setSubmitError(
          err.response?.data
            ?.message ||
            "Unable to save event."
        );
      } else {
        setSubmitError(
          "Unable to save event."
        );
      }
    }
  }

  // ----------------------------------------------------
  // LOADING
  // ----------------------------------------------------
  if (loading) {
    return (
      <main
        style={{
          maxWidth:
            "850px",

          margin:
            "0 auto",

          padding:
            "40px 24px",
        }}
      >
        <p>
          Loading event
          form...
        </p>
      </main>
    );
  }

  // ----------------------------------------------------
  // PAGE ERROR
  // ----------------------------------------------------
  if (pageError) {
    return (
      <main
        style={{
          maxWidth:
            "850px",

          margin:
            "0 auto",

          padding:
            "40px 24px",
        }}
      >
        <p>
          {pageError}
        </p>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth:
          "850px",

        margin:
          "0 auto",

        padding:
          "40px 24px",
      }}
    >
      <Link
        to={`/organizer?organizerId=${organizerId}`}
      >
        ← Back to
        Dashboard
      </Link>

      <header
        style={{
          marginTop:
            "28px",
        }}
      >
        <h1>
          {isEditing
            ? "Edit Event"
            : "Create Event"}
        </h1>

        {currentEvent && (
          <p>
            Current Status:{" "}
            <strong>
              {
                currentEvent.status
              }
            </strong>
          </p>
        )}
      </header>

      {successMessage && (
        <div
          style={{
            padding:
              "14px",

            marginTop:
              "20px",

            background:
              "#f1fff3",

            border:
              "1px solid #b7d8ba",

            borderRadius:
              "10px",
          }}
        >
          {successMessage}
        </div>
      )}

      {submitError && (
        <div
          style={{
            padding:
              "14px",

            marginTop:
              "20px",

            background:
              "#fff4f4",

            border:
              "1px solid #e0b4b4",

            borderRadius:
              "10px",
          }}
        >
          {submitError}
        </div>
      )}

      <form
        onSubmit={
          handleSubmit(
            onSubmit
          )
        }
        style={{
          marginTop:
            "28px",

          padding:
            "28px",

          background:
            "white",

          border:
            "1px solid #ddd",

          borderRadius:
            "16px",
        }}
      >
        {/* TITLE */}
        <FieldGroup
          label="Event Title"
          error={
            errors.title
              ?.message
          }
        >
          <input
            {...register(
              "title"
            )}
            style={
              inputStyle
            }
          />
        </FieldGroup>

        {/* DESCRIPTION */}
        <FieldGroup
          label="Description"
          error={
            errors.description
              ?.message
          }
        >
          <textarea
            rows={6}
            {...register(
              "description"
            )}
            style={
              inputStyle
            }
          />
        </FieldGroup>

        {/* VENUE */}
        <FieldGroup
          label="Venue"
          error={
            errors.venue
              ?.message
          }
        >
          <select
            {...register(
              "venue"
            )}
            style={
              inputStyle
            }
          >
            <option value="">
              Select venue
            </option>

            {venues.map(
              (venue) => (
                <option
                  key={
                    venue._id
                  }
                  value={
                    venue._id
                  }
                >
                  {
                    venue.name
                  }{" "}
                  -{" "}
                  {
                    venue.city
                  }
                </option>
              )
            )}
          </select>
        </FieldGroup>

        {/* CATEGORIES */}
        <FieldGroup
          label="Categories"
          error={
            errors.categories
              ?.message
          }
        >
          <div
            style={{
              display:
                "grid",

              gap:
                "8px",
            }}
          >
            {categories.map(
              (
                category
              ) => (
                <label
                  key={
                    category._id
                  }
                >
                  <input
                    type="checkbox"
                    value={
                      category._id
                    }
                    {...register(
                      "categories"
                    )}
                  />{" "}
                  {
                    category.name
                  }
                </label>
              )
            )}
          </div>
        </FieldGroup>

        {/* START DATE */}
        <FieldGroup
          label="Start Date"
          error={
            errors.startDate
              ?.message
          }
        >
          <input
            type="date"
            {...register(
              "startDate"
            )}
            style={
              inputStyle
            }
          />
        </FieldGroup>

        {/* END DATE */}
        <FieldGroup
          label="End Date"
          error={
            errors.endDate
              ?.message
          }
        >
          <input
            type="date"
            {...register(
              "endDate"
            )}
            style={
              inputStyle
            }
          />
        </FieldGroup>

        {/* START TIME */}
        <FieldGroup
          label="Start Time"
          error={
            errors.startTime
              ?.message
          }
        >
          <input
            type="time"
            {...register(
              "startTime"
            )}
            style={
              inputStyle
            }
          />
        </FieldGroup>

        {/* END TIME */}
        <FieldGroup
          label="End Time"
          error={
            errors.endTime
              ?.message
          }
        >
          <input
            type="time"
            {...register(
              "endTime"
            )}
            style={
              inputStyle
            }
          />
        </FieldGroup>

        {/* HIDDEN POSTER URL */}
        <input
          type="hidden"
          {...register(
            "posterUrl"
          )}
        />

        {/* EVENT POSTER */}
        <FieldGroup
          label="Event Poster"
          error={
            errors.posterUrl
              ?.message
          }
        >
          <div
            style={{
              padding:
                "18px",

              border:
                "1px solid #ddd",

              borderRadius:
                "12px",

              background:
                "#fafafa",
            }}
          >
            {posterUrl ? (
              <>
                <img
                  src={
                    posterUrl
                  }
                  alt="Event poster preview"
                  style={{
                    display:
                      "block",

                    width:
                      "100%",

                    maxWidth:
                      "420px",

                    maxHeight:
                      "420px",

                    objectFit:
                      "cover",

                    borderRadius:
                      "12px",

                    marginBottom:
                      "16px",
                  }}
                />

                <div
                  style={{
                    display:
                      "flex",

                    gap:
                      "10px",

                    flexWrap:
                      "wrap",
                  }}
                >
                  <button
                    type="button"
                    disabled={
                      uploadingPoster
                    }
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                  >
                    {uploadingPoster
                      ? "Uploading..."
                      : "Change Image"}
                  </button>

                  <button
                    type="button"
                    disabled={
                      uploadingPoster
                    }
                    onClick={
                      removePoster
                    }
                  >
                    Remove Image
                  </button>
                </div>
              </>
            ) : (
              <>
                <p
                  style={{
                    marginTop:
                      0,

                    marginBottom:
                      "12px",
                  }}
                >
                  Upload a poster
                  for this event.
                </p>

                <button
                  type="button"
                  disabled={
                    uploadingPoster
                  }
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                >
                  {uploadingPoster
                    ? "Uploading..."
                    : "Choose Event Poster"}
                </button>
              </>
            )}

            <input
              ref={
                fileInputRef
              }
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={
                handlePosterChange
              }
              style={{
                display:
                  "none",
              }}
            />

            <small
              style={{
                display:
                  "block",

                marginTop:
                  "12px",
              }}
            >
              JPG, PNG, or
              WEBP. Maximum
              10 MB.
            </small>

            {posterError && (
              <p
                style={{
                  color:
                    "#b42318",

                  fontSize:
                    "14px",

                  marginTop:
                    "10px",

                  marginBottom:
                    0,
                }}
              >
                {
                  posterError
                }
              </p>
            )}

            {uploadingPoster && (
              <p
                style={{
                  marginBottom:
                    0,

                  marginTop:
                    "10px",
                }}
              >
                Uploading poster
                to Cloudinary...
              </p>
            )}
          </div>
        </FieldGroup>

        {/* ACTIONS */}
        <div
          style={{
            display:
              "flex",

            gap:
              "12px",

            flexWrap:
              "wrap",

            marginTop:
              "30px",
          }}
        >
          <button
            type="submit"
            disabled={
              isSubmitting ||
              uploadingPoster
            }
            onClick={() =>
              setAction(
                "save"
              )
            }
          >
            {uploadingPoster
              ? "Uploading Poster..."
              : isSubmitting &&
                  action ===
                    "save"
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Save Draft"}
          </button>

          {(currentEvent?.status ===
            "draft" ||
            currentEvent?.status ===
              "rejected" ||
            !currentEvent) && (
            <button
              type="submit"
              disabled={
                isSubmitting ||
                uploadingPoster
              }
              onClick={() =>
                setAction(
                  "submit"
                )
              }
            >
              {uploadingPoster
                ? "Uploading Poster..."
                : isSubmitting &&
                    action ===
                      "submit"
                  ? "Submitting..."
                  : "Submit for Review"}
            </button>
          )}
        </div>
      </form>
    </main>
  );
}

// ------------------------------------------------------
// REUSABLE FIELD
// ------------------------------------------------------
function FieldGroup({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children:
    React.ReactNode;
}) {
  return (
    <div
      style={{
        marginBottom:
          "22px",
      }}
    >
      <label
        style={{
          display:
            "block",

          fontWeight:
            600,

          marginBottom:
            "8px",
        }}
      >
        {label}
      </label>

      {children}

      {error && (
        <p
          style={{
            color:
              "#b42318",

            fontSize:
              "14px",

            marginTop:
              "6px",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

const inputStyle:
  React.CSSProperties = {
    width: "100%",
    padding:
      "12px 14px",
    border:
      "1px solid #ccc",
    borderRadius:
      "8px",
    background:
      "white",
  };