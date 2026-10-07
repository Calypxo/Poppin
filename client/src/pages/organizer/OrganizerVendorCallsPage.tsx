import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "../../api/client";
import { localDateKey } from "../../components/home/weeklyCalendar";
import Field from "../../components/forms/FieldGroup";
import { useAuth } from "../../auth/context";
import useResource, { errorMessage } from "../../hooks/useResource";
import type { Category, Event } from "../../types/event";
import type { VendorCall } from "../../types/vendorCall";
import {
  vendorCallSchema,
  type VendorCallFormInput,
  type VendorCallFormData,
} from "../../schemas/vendorCallSchema";
import { PageContainer, PageHeader } from "../../components/layout/Page";
import {
  Input,
  Textarea,
  Select,
  Checkbox,
} from "../../components/ui/FormControls";
import Button, { ButtonLink } from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import Card from "../../components/ui/Card";
import ResourceState from "../../components/shared/ResourceState";
import StatusBadge from "../../components/shared/StatusBadge";
import { useUI } from "../../components/ui/context";
export default function OrganizerVendorCallsPage() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const { confirm, toast } = useUI();
  const events = useResource<Event[]>("/events/mine");
  const categories = useResource<Category[]>("/categories");
  const calls = useResource<VendorCall[]>("/vendor-calls/mine");
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const defaults: VendorCallFormInput = {
    event: eventId || "",
    title: "",
    description: "",
    applicationStartDate: "",
    applicationDeadline: "",
    totalSlots: 1,
    boothFee: 0,
    boothSize: "",
    requirements: "",
    acceptedCategories: [],
  };
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VendorCallFormInput, undefined, VendorCallFormData>({
    resolver: zodResolver(vendorCallSchema),
    defaultValues: defaults,
  });
  const ownEvents =
    events.data?.filter(
      (event) =>
        event.organizer?._id === user?.organizerId &&
        (!eventId || event._id === eventId),
    ) || [];
  const ownCalls =
    calls.data?.filter((call) =>
      ownEvents.some((event) => event._id === call.event._id),
    ) || [];
  function resetForm() {
    setEditingId("");
    reset(defaults);
  }
  function startEditing(call: VendorCall) {
    setEditingId(call._id);
    reset({
      event: call.event._id,
      title: call.title,
      description: call.description,
      applicationStartDate: localDateKey(call.applicationStartDate),
      applicationDeadline: localDateKey(call.applicationDeadline),
      totalSlots: call.totalSlots,
      boothFee: call.boothFee,
      boothSize: call.boothSize || "",
      requirements: call.requirements?.join(", ") || "",
      acceptedCategories:
        call.acceptedCategories?.map((category) => category._id) || [],
    });
    setError("");
    formRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
    formRef.current
      ?.querySelector<HTMLInputElement>('input[name="title"]')
      ?.focus({ preventScroll: true });
  }
  async function save(data: VendorCallFormData, status: "draft" | "open") {
    setError("");
    const selected = ownEvents.find((event) => event._id === data.event);
    if (!selected) {
      setError("You can only create a vendor call for your own event.");
      return;
    }
    if (status === "open" && selected.status !== "published") {
      setError(
        "The event must be published before opening vendor applications.",
      );
      return;
    }
    try {
      const payload = {
        ...data,
        applicationStartDate: data.applicationStartDate + "T00:00:00+08:00",
        applicationDeadline: data.applicationDeadline + "T23:59:59+08:00",
        boothSize: data.boothSize || "",
        requirements: data.requirements
          ? data.requirements
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
        status,
        isActive: true,
      };
      if (editingId) await api.patch(`/vendor-calls/${editingId}`, payload);
      else await api.post("/vendor-calls", payload);
      toast.success(
        status === "open"
          ? "Vendor recruitment is open. Let’s build your lineup!"
          : "Vendor call draft saved.",
      );
      resetForm();
      calls.reload();
    } catch (err) {
      setError(errorMessage(err));
    }
  }
  async function remove(call: VendorCall) {
    if (
      !(await confirm({
        title: `Delete “${call.title}”?`,
        description:
          "This permanently removes the vendor call. Calls with applications cannot be deleted.",
        confirmLabel: "Delete vendor call",
        cancelLabel: "Keep call",
      }))
    )
      return;
    setDeleting(call._id);
    setError("");
    try {
      await api.delete(`/vendor-calls/${call._id}`);
      if (editingId === call._id) resetForm();
      toast.success("Vendor call deleted.");
      calls.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDeleting("");
    }
  }
  return (
    <PageContainer>
      <Link to={eventId ? `/events/${eventId}` : "/my-events"}>
        ← Back to your {eventId ? "event" : "events"}
      </Link>
      <PageHeader
        eyebrow="Good businesses. A great little market."
        title="Vendor recruitment"
        description="Invite the makers, bakers and local favorites that make your event special."
        motif="flower-market-booth"
      />
      <ResourceState {...events} />
      <ResourceState {...categories} />
      {error && <Alert variant="error">{error}</Alert>}
      {!events.loading && !events.error && !ownEvents.length ? (
        <ResourceState
          loading={false}
          error=""
          empty="Create your own event before opening vendor recruitment."
          action={<ButtonLink to="/events/new">Create an event</ButtonLink>}
        />
      ) : (
        !events.loading &&
        !categories.loading &&
        !events.error &&
        !categories.error && (
          <div className="poppin-management-grid">
            <form
              ref={formRef}
              noValidate
              onSubmit={handleSubmit((data) => save(data, "draft"))}
            >
              <h2>
                {editingId
                  ? "Edit your vendor call"
                  : "A place for local businesses"}
              </h2>
              <p className="mb-6 text-sm">
                Set the dates, spaces and details vendors need to know.
              </p>
              <Field label="Event" error={errors.event?.message}>
                <Select {...register("event")}>
                  <option value="">Select event</option>
                  {ownEvents.map((event) => (
                    <option key={event._id} value={event._id}>
                      {event.title} ({event.status})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Vendor Call Title" error={errors.title?.message}>
                <Input {...register("title")} />
              </Field>
              <Field label="Description" error={errors.description?.message}>
                <Textarea rows={5} {...register("description")} />
              </Field>
              <div className="poppin-field-pair">
                <Field
                  label="Application Opening Date"
                  error={errors.applicationStartDate?.message}
                >
                  <Input type="date" {...register("applicationStartDate")} />
                </Field>
                <Field
                  label="Application Deadline"
                  error={errors.applicationDeadline?.message}
                >
                  <Input type="date" {...register("applicationDeadline")} />
                </Field>
                <Field
                  label="Total Vendor Slots"
                  error={errors.totalSlots?.message}
                >
                  <Input type="number" min="1" {...register("totalSlots")} />
                </Field>
                <Field label="Booth Fee" error={errors.boothFee?.message}>
                  <Input type="number" min="0" {...register("boothFee")} />
                </Field>
              </div>
              <Field label="Booth Size">
                <Input
                  placeholder="Example: 2m x 2m"
                  {...register("boothSize")}
                />
              </Field>
              <Field label="Requirements">
                <Textarea
                  rows={4}
                  placeholder="Separate each requirement with a comma"
                  {...register("requirements")}
                />
                <small>
                  Example: Business name, product list, social media page
                </small>
              </Field>
              <Field
                label="Accepted Categories"
                error={errors.acceptedCategories?.message}
              >
                <div className="poppin-checkbox-grid">
                  {categories.data?.map((category) => (
                    <label key={category._id}>
                      <Checkbox
                        value={category._id}
                        {...register("acceptedCategories")}
                      />
                      {category.name}
                    </label>
                  ))}
                </div>
              </Field>
              <div className="poppin-actions">
                <Button type="submit" variant="outline" loading={isSubmitting}>
                  {editingId ? "Save Changes" : "Save Draft"}
                </Button>
                <Button
                  disabled={isSubmitting}
                  onClick={handleSubmit((data) => save(data, "open"))}
                >
                  Open Vendor Call
                </Button>
                {editingId && (
                  <Button variant="ghost" onClick={resetForm}>
                    Cancel Editing
                  </Button>
                )}
              </div>
            </form>
            <section>
              <h2>Your vendor calls</h2>
              <ResourceState
                {...calls}
                empty={
                  !ownCalls.length
                    ? "Your first vendor call will appear here. Start with the details on the left."
                    : ""
                }
              />
              <div className="poppin-record-list">
                {ownCalls.map((call) => (
                  <Card variant="ticket" key={call._id}>
                    <StatusBadge status={call.status} />
                    <h3 className="mt-4">{call.title}</h3>
                    <p>{call.event.title}</p>
                    <p>{call.description}</p>
                    <dl className="poppin-opportunity-meta">
                      <div>
                        <dt>Opens</dt>
                        <dd>
                          {new Date(
                            call.applicationStartDate,
                          ).toLocaleDateString("en-PH", {
                            timeZone: "Asia/Manila",
                          })}
                        </dd>
                      </div>
                      <div>
                        <dt>Apply by</dt>
                        <dd>
                          {new Date(
                            call.applicationDeadline,
                          ).toLocaleDateString("en-PH", {
                            timeZone: "Asia/Manila",
                          })}
                        </dd>
                      </div>
                      <div>
                        <dt>Spaces</dt>
                        <dd>{call.totalSlots}</dd>
                      </div>
                      <div>
                        <dt>Booth fee</dt>
                        <dd>₱{call.boothFee.toLocaleString()}</dd>
                      </div>
                    </dl>
                    <div className="poppin-actions">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditing(call)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        loading={deleting === call._id}
                        onClick={() => void remove(call)}
                      >
                        Delete
                      </Button>
                      <ButtonLink
                        size="sm"
                        variant="ghost"
                        to={`/events/${call.event._id}/applications`}
                      >
                        Applications ↗
                      </ButtonLink>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        )
      )}
    </PageContainer>
  );
}
