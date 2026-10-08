import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarPlus,
  Settings2,
  Store,
} from "lucide-react";
import { useAuth } from "../../auth/context";
import useResource from "../../hooks/useResource";
import type { Event } from "../../types/event";
import type {
  VendorLineupItem,
  VendorApplicationListItem,
} from "../../types/vendorApplication";
import type { Announcement } from "../../types/announcement";
import type {
  VendorCall,
  VendorCallAvailability,
} from "../../types/vendorCall";
import ResourceState from "../../components/shared/ResourceState";
import EventPostCard from "../../components/shared/EventPostCard";
import StatusBadge from "../../components/shared/StatusBadge";
import EventHeader from "../../components/events/EventHeader";
import VendorLineup from "../../components/vendors/VendorLineup";
import VendorOpportunityCard from "../../components/vendors/VendorOpportunityCard";
import { PageContainer } from "../../components/layout/Page";
import Button, { ButtonLink } from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Tabs from "../../components/ui/Tabs";
import Alert from "../../components/ui/Alert";

export default function EventDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");
  const resource = useResource<Event>("/events/" + id);
  const event = resource.data;
  const posts = useResource<Announcement[]>(
    event ? "/posts/event/" + id : null,
  );
  const vendors = useResource<VendorLineupItem[]>(
    event ? "/events/" + id + "/vendors" : null,
  );
  const call = useResource<VendorCall>(
    event?.status === "published" ? "/vendor-calls/event/" + id : null,
  );
  const availability = useResource<VendorCallAvailability>(
    call.data ? "/vendor-calls/" + call.data._id + "/availability" : null,
  );
  const applications = useResource<VendorApplicationListItem[]>(
    user && event ? "/vendor-applications?event=" + id : null,
  );
  const owner = !!user && event?.organizer.user === user._id;
  const mine = applications.data?.[0];
  return (
    <PageContainer className="poppin-event-page">
      <Link className="poppin-back-link" to="/discover">
        <ArrowLeft size={16} aria-hidden="true" />
        All events
      </Link>
      <ResourceState {...resource} />
      {event && (
        <>
          <EventHeader event={event} />
          {user && <ResourceState {...applications} />}
          {mine && (
            <Alert variant={mine.status === "accepted" ? "success" : "info"}>
              Your application is <StatusBadge status={mine.status} />.{" "}
              <Link to="/my-applications">View application</Link>
            </Alert>
          )}
          {owner && (
            <section
              className="poppin-owner-toolbar"
              aria-label="Manage your event"
            >
              <div>
                <Settings2 size={19} aria-hidden="true" />
                <span>You’re hosting this event</span>
              </div>
              <div className="poppin-actions">
                {event.status !== "cancelled" && (
                  <ButtonLink
                    variant="outline"
                    size="sm"
                    to={"/events/" + id + "/edit"}
                  >
                    Edit event
                  </ButtonLink>
                )}
                <ButtonLink size="sm" to={"/events/" + id + "/posts"}>
                  Post an update
                </ButtonLink>
                <ButtonLink
                  variant="outline"
                  size="sm"
                  to={"/events/" + id + "/vendor-call"}
                >
                  Manage recruitment
                </ButtonLink>
                <ButtonLink
                  variant="ghost"
                  size="sm"
                  to={"/events/" + id + "/applications"}
                >
                  Review applications
                </ButtonLink>
              </div>
            </section>
          )}
          <div className="poppin-event-content">
            <Tabs
              label="Event sections"
              value={tab}
              onChange={setTab}
              items={[
                { value: "overview", label: "The event" },
                { value: "updates", label: "Updates" },
                { value: "lineup", label: "Vendor lineup" },
                ...(event.status === "published"
                  ? [{ value: "opportunity", label: "Join the market" }]
                  : []),
              ]}
            >
              {tab === "overview" && (
                <div className="poppin-event-overview">
                  <Card className="poppin-event-story">
                    <p className="poppin-eyebrow">THE PLAN</p>
                    <h2>Here’s what’s happening.</h2>
                    <p className="poppin-preserve-lines">{event.description}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<ArrowUpRight size={16} aria-hidden="true" />}
                      onClick={() => setTab("updates")}
                    >
                      See organizer updates
                    </Button>
                  </Card>
                  <aside className="poppin-event-invite">
                    <span className="poppin-section-icon">
                      <Store size={26} aria-hidden="true" />
                    </span>
                    <p className="poppin-eyebrow">MEET THE LOCAL LINEUP</p>
                    <h2>Good people. Great finds.</h2>
                    <p>
                      Get to know the businesses joining this event before you
                      drop by.
                    </p>
                    <Button variant="outline" onClick={() => setTab("lineup")}>
                      Meet the vendors{" "}
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </Button>
                    {event.status === "published" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTab("opportunity")}
                      >
                        Bring your business{" "}
                        <CalendarPlus size={16} aria-hidden="true" />
                      </Button>
                    )}
                  </aside>
                </div>
              )}
              {tab === "updates" && (
                <section
                  className="poppin-event-updates"
                  aria-labelledby="event-updates-title"
                >
                  <div className="poppin-section-heading">
                    <div>
                      <p className="poppin-eyebrow">STRAIGHT FROM THE HOST</p>
                      <h2 id="event-updates-title">
                        The latest on this event.
                      </h2>
                    </div>
                  </div>
                  <ResourceState
                    {...posts}
                    empty={
                      !posts.data?.length
                        ? "No updates yet. Check back for the latest news from the organizer."
                        : ""
                    }
                  />
                  <div className="poppin-news-stream">
                    {posts.data?.map((post) => (
                      <EventPostCard key={post._id} post={post} />
                    ))}
                  </div>
                </section>
              )}
              {tab === "lineup" && (
                <VendorLineup
                  vendors={vendors.data || []}
                  loading={vendors.loading}
                  error={vendors.error}
                  reload={vendors.reload}
                />
              )}
              {tab === "opportunity" && (
                <section
                  className="poppin-event-recruitment"
                  aria-labelledby="event-recruitment-title"
                >
                  <div className="poppin-section-heading">
                    <div>
                      <p className="poppin-eyebrow">
                        YOUR BUSINESS BELONGS HERE
                      </p>
                      <h2 id="event-recruitment-title">Join the market.</h2>
                      <p>
                        Find out what the organizer is looking for and send your
                        application.
                      </p>
                    </div>
                  </div>
                  <ResourceState
                    {...call}
                    empty={
                      !call.data
                        ? "There is no open recruitment for this event right now."
                        : ""
                    }
                    action={
                      <ButtonLink variant="outline" to="/opportunities">
                        Browse opportunities
                      </ButtonLink>
                    }
                  />
                  {call.data && (
                    <VendorOpportunityCard
                      call={call.data}
                      availability={availability.data || undefined}
                      detailed
                    >
                      <ResourceState {...availability} />
                      {availability.data && (
                        <div className="poppin-actions">
                          {mine ? (
                            <ButtonLink to="/my-applications" variant="outline">
                              View application
                            </ButtonLink>
                          ) : (
                            availability.data.availability.canApply &&
                            (user ? (
                              !applications.loading &&
                              !applications.error && (
                                <ButtonLink
                                  to={"/vendor-application/" + call.data._id}
                                  icon={
                                    <ArrowUpRight
                                      size={17}
                                      aria-hidden="true"
                                    />
                                  }
                                >
                                  Apply as a vendor
                                </ButtonLink>
                              )
                            ) : (
                              <ButtonLink
                                to="/login"
                                state={{
                                  from: "/vendor-application/" + call.data._id,
                                }}
                              >
                                Log in to apply
                              </ButtonLink>
                            ))
                          )}
                        </div>
                      )}
                    </VendorOpportunityCard>
                  )}
                </section>
              )}
            </Tabs>
          </div>
        </>
      )}
    </PageContainer>
  );
}
