import { useState } from "react";
import api from "../../api/client";
import useResource, { errorMessage } from "../../hooks/useResource";
import type { Event } from "../../types/event";
import EventCard from "../../components/events/EventCard";
import ResourceState from "../../components/shared/ResourceState";
import { PageContainer, PageHeader } from "../../components/layout/Page";
import Button, { ButtonLink } from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import DropdownMenu from "../../components/ui/DropdownMenu";
import Tabs from "../../components/ui/Tabs";
import { useUI } from "../../components/ui/context";
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
    <PageContainer>
      <PageHeader
        eyebrow="Your local plans"
        title="My events"
        description="From the first little idea to a full weekend market. Publish when you’re ready."
        motif="craft-booth"
        actions={
          <>
            <ButtonLink to="/events/new">Create an event ↗</ButtonLink>
            <ButtonLink variant="outline" to="/profile">
              Organizer profile
            </ButtonLink>
          </>
        }
      />
      <div className="poppin-actions">
        <ButtonLink size="sm" variant="ghost" to="/applications?view=incoming">
          Vendor applications
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
        <div className="poppin-discover-grid">
          {events.map((event) => (
            <article key={event._id}>
              <EventCard event={event} />
              {event.managementStats && (
                <dl
                  className="poppin-opportunity-meta"
                  aria-label={`${event.title} applications and capacity`}
                >
                  <div>
                    <dt>Applications</dt>
                    <dd>{event.managementStats.totalApplications}</dd>
                  </div>
                  <div>
                    <dt>Pending</dt>
                    <dd>{event.managementStats.pendingApplications}</dd>
                  </div>
                  <div>
                    <dt>Accepted vendors</dt>
                    <dd>{event.managementStats.acceptedVendors}</dd>
                  </div>
                  <div>
                    <dt>Remaining slots</dt>
                    <dd>
                      {event.managementStats.remainingSlots} /{" "}
                      {event.managementStats.totalSlots}
                    </dd>
                  </div>
                </dl>
              )}
              <div className="poppin-actions">
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
