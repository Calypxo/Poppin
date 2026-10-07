import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../auth/context";
import useResource from "../../hooks/useResource";
import type { Event } from "../../types/event";
import type { VendorLineupItem } from "../../types/vendorApplication";
import type { Announcement } from "../../types/announcement";
import type {
  VendorCall,
  VendorCallAvailability,
} from "../../types/vendorCall";
import type { VendorApplicationListItem } from "../../types/vendorApplication";
import ResourceState from "../../components/shared/ResourceState";
import EventPostCard from "../../components/shared/EventPostCard";
import StatusBadge from "../../components/shared/StatusBadge";
import EventHeader from "../../components/events/EventHeader";
import VendorLineup from "../../components/vendors/VendorLineup";
import VendorOpportunityCard from "../../components/vendors/VendorOpportunityCard";
import { PageContainer } from "../../components/layout/Page";
import { ButtonLink } from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Tabs from "../../components/ui/Tabs";
import Alert from "../../components/ui/Alert";
export default function EventDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");
  const resource = useResource<Event>(`/events/${id}`);
  const event = resource.data;
  const posts = useResource<Announcement[]>(
    event ? `/posts/event/${id}` : null,
  );
  const vendors = useResource<VendorLineupItem[]>(
    event ? `/events/${id}/vendors` : null,
  );
  const call = useResource<VendorCall>(
    event?.status === "published" ? `/vendor-calls/event/${id}` : null,
  );
  const availability = useResource<VendorCallAvailability>(
    call.data ? `/vendor-calls/${call.data._id}/availability` : null,
  );
  const applications = useResource<VendorApplicationListItem[]>(
    user && event ? `/vendor-applications?event=${id}` : null,
  );
  const owner = !!user && event?.organizer.user === user._id;
  const mine = applications.data?.[0];
  return (
    <PageContainer>
      <Link to="/discover">← Discover events</Link>
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
            <section className="poppin-owner-actions">
              <span className="poppin-eyebrow">
                Your event, your little corner of the market
              </span>
              <div className="poppin-actions">
                {event.status !== "cancelled" && (
                  <ButtonLink
                    variant="outline"
                    size="sm"
                    to={`/events/${id}/edit`}
                  >
                    Edit event
                  </ButtonLink>
                )}
                <ButtonLink size="sm" to={`/events/${id}/posts`}>
                  Post an update
                </ButtonLink>
                <ButtonLink
                  variant="outline"
                  size="sm"
                  to={`/events/${id}/vendor-call`}
                >
                  Manage recruitment
                </ButtonLink>
                <ButtonLink
                  variant="ghost"
                  size="sm"
                  to={`/events/${id}/applications`}
                >
                  Review applications & lineup
                </ButtonLink>
              </div>
            </section>
          )}
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
              <Card>
                <p className="poppin-eyebrow">A LITTLE ABOUT THE EVENT</p>
                <h2>Make a little plan</h2>
                <p className="poppin-preserve-lines">{event.description}</p>
              </Card>
            )}
            {tab === "updates" && (
              <section>
                <h2>From the organizer</h2>
                <ResourceState
                  {...posts}
                  empty={
                    !posts.data?.length
                      ? "No updates yet. Keep a little room for news from the organizer."
                      : ""
                  }
                />
                <div className="poppin-record-list">
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
              <section>
                <h2>Bring your business</h2>
                <ResourceState
                  {...call}
                  empty={
                    !call.data
                      ? "There is no open vendor call for this event. Explore the other local opportunities."
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
                      <>
                        {user ? (
                          <>
                            <ResourceState {...applications} />
                            {mine ? (
                              <Alert
                                variant={
                                  mine.status === "accepted"
                                    ? "success"
                                    : "info"
                                }
                              >
                                Your application is{" "}
                                <StatusBadge status={mine.status} />.{" "}
                                <Link to="/my-applications">
                                  View application
                                </Link>
                              </Alert>
                            ) : (
                              availability.data.availability.canApply &&
                              !applications.loading &&
                              !applications.error && (
                                <div className="poppin-actions">
                                  <ButtonLink
                                    to={`/vendor-application/${call.data._id}`}
                                  >
                                    Apply as a vendor ↗
                                  </ButtonLink>
                                </div>
                              )
                            )}
                          </>
                        ) : !user ? (
                          <div className="poppin-actions">
                            <ButtonLink
                              to="/login"
                              state={{
                                from: `/vendor-application/${call.data._id}`,
                              }}
                            >
                              Log in to apply
                            </ButtonLink>
                          </div>
                        ) : null}
                      </>
                    )}
                  </VendorOpportunityCard>
                )}
              </section>
            )}
          </Tabs>
        </>
      )}
    </PageContainer>
  );
}
