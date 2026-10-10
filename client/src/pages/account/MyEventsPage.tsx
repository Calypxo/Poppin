import { useState } from "react";
import api from "../../api/client";
import { Link } from "react-router-dom";
import useResource, { errorMessage } from "../../hooks/useResource";
import type { Event } from "../../types/event";
import { EventPoster } from "../../components/home/EventPresentation";
import { eventDate, eventLocation } from "../../components/home/eventFormatting";
import StatusBadge from "../../components/shared/StatusBadge";
import ResourceState from "../../components/shared/ResourceState";
import { PageContainer, PageHeader } from "../../components/layout/Page";
import Button, { ButtonLink } from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import DropdownMenu from "../../components/ui/DropdownMenu";
import Tabs from "../../components/ui/Tabs";
import { useUI } from "../../components/ui/context";
import { ArrowUpRight, CalendarDays, FileText, MapPin, Users } from "lucide-react";
export default function MyEventsPage() {
  const resource = useResource<Event[]>("/events/mine");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [filter, setFilter] = useState("all");
  const { confirm, toast } = useUI();
  async function action(event: Event, method: "publish" | "cancel" | "delete") {
    const label =
      method === "publish"
        ? "Publish"
        : method === "cancel"
          ? "Cancel"
          : "Delete";
    if (
      !(await confirm({
        title: `${label} “${event.title}”?`,
        description:
          method === "publish"
            ? "Your event will appear in Discover and the shared feed immediately."
            : method === "cancel"
              ? "Your event will leave public discovery. Confirmed vendors can still read their booking and updates."
              : "This permanently deletes the event. Events with updates, recruitment or applications must have those records handled first.",
        confirmLabel: `${label} event`,
        cancelLabel: method === "publish" ? "Keep draft" : "Keep event",
        variant: method === "publish" ? "primary" : "danger",
      }))
    )
      return;
    setBusy(event._id);
    setError("");
    try {
      if (method === "delete") await api.delete(`/events/${event._id}`);
      else
        await api.patch(`/events/${event._id}/status`, {
          status: method === "publish" ? "published" : "cancelled",
        });
      toast.success(
        method === "publish"
          ? "Your event is live. See you at the market!"
          : method === "cancel"
            ? "Event cancelled."
            : "Event deleted.",
      );
      resource.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy("");
    }
  }
  const events =
    resource.data?.filter(
      (event) => filter === "all" || event.status === filter,
    ) || [];
  return (
    <PageContainer className="poppin-management-page">
      <PageHeader
        eyebrow="ORGANIZER WORKSPACE"
        title="My events"
        description="From your first idea to opening day. Everything you’re bringing to life, in one place."
        motif="printed-shirt"
        actions={
          <>
            <ButtonLink to="/events/new">Create an event ↗</ButtonLink>
            <ButtonLink variant="outline" to="/profile">
              Organizer profile
            </ButtonLink>
          </>
        }
      />
      {resource.data && (
        <div className="poppin-account-metrics">
          <div>
            <CalendarDays size={22} aria-hidden="true" />
            <span>Published events</span>
            <strong>
              {
                resource.data.filter((event) => event.status === "published")
                  .length
              }
            </strong>
          </div>
          <div>
            <FileText size={22} aria-hidden="true" />
            <span>Drafts in progress</span>
            <strong>
              {resource.data.filter((event) => event.status === "draft").length}
            </strong>
          </div>
          <div>
            <Users size={22} aria-hidden="true" />
            <span>Pending applications</span>
            <strong>
              {resource.data.reduce(
                (count, event) =>
                  count + (event.managementStats?.pendingApplications || 0),
                0,
              )}
            </strong>
          </div>
        </div>
      )}
      <div className="poppin-management-toolbar">
        <ButtonLink size="sm" variant="ghost" to="/applications?view=incoming">
          Vendor applications
          <ArrowUpRight size={15} aria-hidden="true" />
        </ButtonLink>
        <ButtonLink size="sm" variant="ghost" to="/catalog">
          Venues & categories
        </ButtonLink>
      </div>
      {error && (
        <Alert variant="error" onDismiss={() => setError("")}>
          {error}
        </Alert>
      )}
      <Tabs
        label="Your event status"
        value={filter}
        onChange={setFilter}
        items={[
          { value: "all", label: "All events" },
          { value: "draft", label: "Drafts" },
          { value: "published", label: "Published" },
          { value: "cancelled", label: "Cancelled" },
        ]}
      >
        <ResourceState
          {...resource}
          empty={
            !events.length
              ? "Your first event starts with a little idea. Create a draft and make it yours."
              : ""
          }
          action={<ButtonLink to="/events/new">Create an event</ButtonLink>}
        />
        <div className="poppin-managed-events-grid">
          {events.map((event) => (
            <article className="poppin-managed-event" key={event._id}>
              <Link
                to={`/events/${event._id}`}
                className="poppin-managed-event-poster"
                aria-label={`View ${event.title}`}
              >
                <EventPoster event={event} contain />
                <span aria-hidden="true"><ArrowUpRight size={18} /></span>
              </Link>
              <div className="poppin-managed-event-summary">
                <div className="poppin-managed-event-topline">
                  <StatusBadge
                    status={event.status === "published" && event.eventState === "completed"
                      ? "Completed" : event.status}
                  />
                  <span title={event.categories?.[0]?.name}>
                    {event.categories?.[0]?.name || "Local event"}
                  </span>
                </div>
                <h2>
                  <Link to={`/events/${event._id}`} title={event.title}>{event.title}</Link>
                </h2>
                <p>
                  <CalendarDays size={14} aria-hidden="true" />
                  <span>{eventDate(event.startDate, { month: "short", day: "numeric", year: "numeric" })}</span>
                </p>
                <p>
                  <MapPin size={14} aria-hidden="true" />
                  <span title={eventLocation(event)}>{eventLocation(event)}</span>
                </p>
              </div>
              <dl
                className="poppin-management-counts"
                aria-label={`${event.title} applications and capacity${event.managementStats ? "" : ": statistics unavailable"}`}
              >
                <div>
                  <dt>Applications</dt>
                  <dd>{event.managementStats?.totalApplications ?? "—"}</dd>
                </div>
                <div>
                  <dt>Pending</dt>
                  <dd>{event.managementStats?.pendingApplications ?? "—"}</dd>
                </div>
                <div>
                  <dt>Accepted</dt>
                  <dd>{event.managementStats?.acceptedVendors ?? "—"}</dd>
                </div>
                <div>
                  <dt>Slots left</dt>
                  <dd>
                    {event.managementStats ? <>
                      {event.managementStats.remainingSlots} <small>/ {event.managementStats.totalSlots}</small>
                    </> : "—"}
                  </dd>
                </div>
              </dl>
              <div className="poppin-actions poppin-managed-event-actions">
                {event.status !== "cancelled" && (
                  <ButtonLink
                    size="sm"
                    variant="outline"
                    to={`/events/${event._id}/edit`}
                  >
                    Edit event
                  </ButtonLink>
                )}
                {event.status === "draft" && (
                  <Button
                    size="sm"
                    loading={busy === event._id}
                    onClick={() => void action(event, "publish")}
                  >
                    Publish
                  </Button>
                )}
                <DropdownMenu
                  label={`Manage ${event.title}`}
                  items={[
                    {
                      label: "Post an update",
                      to: `/events/${event._id}/posts`,
                    },
                    {
                      label: "Vendor recruitment",
                      to: `/events/${event._id}/vendor-call`,
                    },
                    {
                      label: "Review applications",
                      to: `/events/${event._id}/applications`,
                    },
                    ...(event.status === "published"
                      ? [
                          {
                            label: "Cancel event",
                            danger: true,
                            disabled: busy === event._id,
                            onSelect: () => void action(event, "cancel"),
                          },
                        ]
                      : []),
                    {
                      label: "Delete event",
                      danger: true,
                      disabled: busy === event._id,
                      onSelect: () => void action(event, "delete"),
                    },
                  ]}
                />
              </div>
            </article>
          ))}
        </div>
      </Tabs>
    </PageContainer>
  );
}
