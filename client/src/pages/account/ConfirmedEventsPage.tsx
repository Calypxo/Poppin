import { useState } from "react";
import { Link } from "react-router-dom";
import useResource from "../../hooks/useResource";
import type { Event } from "../../types/event";
import EventCard from "../../components/events/EventCard";
import ResourceState from "../../components/shared/ResourceState";
import { PageContainer, PageHeader } from "../../components/layout/Page";
import { ButtonLink } from "../../components/ui/Button";
import Tabs from "../../components/ui/Tabs";
export default function ConfirmedEventsPage() {
  const resource = useResource<Event[]>("/vendors/me/confirmed-events");
  const [tab, setTab] = useState("upcoming");
  const events =
    resource.data?.filter((event) =>
      tab === "past"
        ? event.eventState === "completed"
        : event.eventState !== "completed",
    ) || [];
  return (
    <PageContainer>
      <Link to="/profile">← My profile</Link>
      <PageHeader
        eyebrow="A little place with your name on it"
        title="My confirmed events"
        description="Your business, out in the local circle. These are the markets where the organizer has confirmed your spot."
        motif="flower-bouquet"
      />
      <Tabs
        label="Confirmed event dates"
        value={tab}
        onChange={setTab}
        items={[
          { value: "upcoming", label: "Upcoming & ongoing" },
          { value: "past", label: "Past events" },
        ]}
      >
        <ResourceState
          {...resource}
          empty={
            !events.length
              ? "No confirmed events in this view yet. Your next market could be just around the corner."
              : ""
          }
          action={
            <ButtonLink to="/opportunities">Find opportunities</ButtonLink>
          }
        />
        <div className="poppin-record-list">
          {events.map((event) => (
            <EventCard variant="compact" key={event._id} event={event} />
          ))}
        </div>
      </Tabs>
    </PageContainer>
  );
}
