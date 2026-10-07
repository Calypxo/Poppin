import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "../../api/client";
import { localDateKey } from "../../components/home/weeklyCalendar";
import FieldGroup from "../../components/forms/FieldGroup";
import ImageUploader from "../../components/forms/ImageUploader";
import {
  Input,
  Textarea,
  Select,
  Checkbox,
} from "../../components/ui/FormControls";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import { LoadingState, ErrorState } from "../../components/ui/States";
import { PageContainer, PageHeader } from "../../components/layout/Page";
import { useUI } from "../../components/ui/context";
import { useAuth } from "../../auth/context";
import useResource, { errorMessage } from "../../hooks/useResource";
import StatusBadge from "../../components/shared/StatusBadge";
import type { Category, Event, Venue } from "../../types/event";
import { eventSchema, type EventFormData } from "../../schemas/eventSchema";
function timeForInput(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return /^\d{2}:\d{2}$/.test(value) ? value : "";
  const hour =
    (Number(match[1]) % 12) + (match[3].toUpperCase() === "PM" ? 12 : 0);
  return String(hour).padStart(2, "0") + ":" + match[2];
}
export default function OrganizerEventFormPage() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { user } = useAuth();
  const { toast } = useUI();
  const venues = useResource<Venue[]>("/venues");
  const categories = useResource<Category[]>("/categories");
  const current = useResource<Event>(eventId ? `/events/${eventId}` : null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
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
  const poster = useWatch({ control, name: "posterUrl" });
  useEffect(() => {
    const event = current.data;
    if (!event) return;
    reset({
      title: event.title,
      description: event.description,
      venue: event.venue?._id || "",
      categories: event.categories?.map((category) => category._id) || [],
      startDate: localDateKey(event.startDate),
      endDate: localDateKey(event.endDate),
      startTime: timeForInput(event.startTime),
      endTime: timeForInput(event.endTime),
      posterUrl: event.posterUrl || "",
    });
  }, [current.data, reset]);
  async function save(data: EventFormData, publish: boolean) {
    if (uploading) return;
    setError("");
    try {
      const payload = {
        ...data,
        organizer: user?.organizerId,
        posterUrl: data.posterUrl || "",
      };
      const saved = eventId
        ? (await api.patch<Event>(`/events/${eventId}`, payload)).data
        : (await api.post<Event>("/events", payload)).data;
      if (publish)
        await api.patch(`/events/${saved._id}/status`, { status: "published" });
      toast.success(
        publish
          ? "Your event is live. See you at the market!"
          : eventId
            ? "Event updated."
            : "Your draft is saved.",
      );
      navigate(`/events/${saved._id}`);
    } catch (err) {
      setError(errorMessage(err));
    }
  }
  const loading = venues.loading || categories.loading || current.loading;
  const loadError =
    venues.error ||
    categories.error ||
    current.error ||
    (current.data?.status === "cancelled"
      ? "Cancelled events cannot be edited."
      : "") ||
    (current.data && current.data.organizer.user !== user?._id
      ? "You can only edit your own events."
      : "");
  return (
    <PageContainer width="form">
      <Link to="/my-events">← Back to my events</Link>
      <PageHeader
        eyebrow="Make room for something local"
        title={eventId ? "Edit your event" : "Create an event"}
        description="Set the scene, save your draft, and share it with your local circle when you’re ready."
      />
      {loading ? (
        <LoadingState label="Preparing your event notes…" />
      ) : loadError ? (
        <ErrorState
          description={loadError}
          onRetry={() => {
            venues.reload();
            categories.reload();
            current.reload();
          }}
        />
      ) : (
        <>
          {current.data && (
            <p>
              Current status: <StatusBadge status={current.data.status} />
            </p>
          )}
          <form noValidate onSubmit={handleSubmit((data) => save(data, false))}>
            <section className="poppin-form-section">
              <h2>The little details</h2>
              <p>Give your event a name and a story worth showing up for.</p>
              <FieldGroup label="Event Title" error={errors.title?.message}>
                <Input {...register("title")} />
              </FieldGroup>
              <FieldGroup
                label="Description"
                error={errors.description?.message}
              >
                <Textarea rows={6} {...register("description")} />
              </FieldGroup>
              <FieldGroup label="Venue" error={errors.venue?.message}>
                <Select {...register("venue")}>
                  <option value="">Select venue</option>
                  {venues.data?.map((venue) => (
                    <option key={venue._id} value={venue._id}>
                      {venue.name} - {venue.city}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              <FieldGroup label="Categories" error={errors.categories?.message}>
                <div className="poppin-checkbox-grid">
                  {categories.data?.map((category) => (
                    <label key={category._id}>
                      <Checkbox
                        value={category._id}
                        {...register("categories")}
                      />
                      {category.name}
                    </label>
                  ))}
                </div>
              </FieldGroup>
            </section>
            <section className="poppin-form-section">
              <h2>Save the date</h2>
              <p>Your event dates and hours, in local Pampanga time.</p>
              <div className="poppin-field-pair">
                <FieldGroup
                  label="Start Date"
                  error={errors.startDate?.message}
                >
                  <Input type="date" {...register("startDate")} />
                </FieldGroup>
                <FieldGroup label="End Date" error={errors.endDate?.message}>
                  <Input type="date" {...register("endDate")} />
                </FieldGroup>
                <FieldGroup
                  label="Start Time"
                  error={errors.startTime?.message}
                >
                  <Input type="time" {...register("startTime")} />
                </FieldGroup>
                <FieldGroup label="End Time" error={errors.endTime?.message}>
                  <Input type="time" {...register("endTime")} />
                </FieldGroup>
              </div>
            </section>
            <input type="hidden" {...register("posterUrl")} />
            <ImageUploader
              label="Event Poster"
              value={poster || ""}
              onChange={(value) =>
                setValue("posterUrl", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              onBusy={setUploading}
            />
            {errors.posterUrl?.message && (
              <Alert variant="error">{errors.posterUrl.message}</Alert>
            )}
            {error && <Alert variant="error">{error}</Alert>}
            <div className="poppin-actions">
              <Button
                type="submit"
                variant="outline"
                loading={isSubmitting}
                disabled={uploading}
              >
                {eventId ? "Save Changes" : "Save Draft"}
              </Button>
              {(!current.data || current.data.status === "draft") && (
                <Button
                  disabled={uploading || isSubmitting}
                  onClick={handleSubmit((data) => save(data, true))}
                >
                  Publish Event
                </Button>
              )}
            </div>
          </form>
        </>
      )}
    </PageContainer>
  );
}
