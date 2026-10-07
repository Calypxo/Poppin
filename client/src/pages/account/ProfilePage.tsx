import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../auth/context";
import useResource from "../../hooks/useResource";
import type { MyProfiles, ProfileResponse } from "../../types/account";
import ProfileHeader from "../../components/shared/ProfileHeader";
import ProfileAbout from "../../components/profiles/ProfileAbout";
import ResourceState from "../../components/shared/ResourceState";
import EventCard from "../../components/events/EventCard";
import EventPostCard from "../../components/shared/EventPostCard";
import { PageContainer } from "../../components/layout/Page";
import { ButtonLink } from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Tabs from "../../components/ui/Tabs";
export default function ProfilePage({
  kind,
}: {
  kind?: "organizer" | "vendor";
}) {
  const { profileId } = useParams();
  const { user } = useAuth();
  const [tab, setTab] = useState("events");
  const resource = useResource<ProfileResponse>(
    kind && profileId
      ? `/${kind === "organizer" ? "organizers" : "vendors"}/${profileId}`
      : null,
  );
  const mine = useResource<MyProfiles>(!kind && user ? "/profiles/me" : null);
  if (!kind && user)
    return (
      <PageContainer>
        <ProfileHeader
          name={user.name}
          image={user.avatarUrl}
          kind="Your local circle"
          city={user.city}
        >
          <ButtonLink variant="outline" size="sm" to="/profile/edit">
            Edit profile
          </ButtonLink>
          <ButtonLink size="sm" to="/discover">
            Discover events ↗
          </ButtonLink>
        </ProfileHeader>
        <Card>
          <h2>My local story</h2>
          <p>
            {user.bio ||
              "A little space for your local story. Tell us what makes a good weekend for you."}
          </p>
          <p>Account email: {user.email}</p>
        </Card>
        <ResourceState {...mine} />
        <div className="poppin-social-grid mt-8">
          <Card variant="paper">
            <p className="poppin-eyebrow">Make a little gathering</p>
            <h2>{mine.data?.organizer?.name || "Host your own event"}</h2>
            <p>
              {mine.data?.organizer?.description ||
                "Bring your local circle together. Add organizer details when you’re ready to share an event."}
            </p>
            <div className="poppin-actions">
              {user.organizerId ? (
                <>
                  <ButtonLink to="/events/new">Create event</ButtonLink>
                  <ButtonLink variant="outline" to="/my-events">
                    My events
                  </ButtonLink>
                  <ButtonLink
                    variant="ghost"
                    to={`/organizers/${user.organizerId}`}
                  >
                    Manage organizer page
                  </ButtonLink>
                </>
              ) : (
                <ButtonLink to="/organizer/profile/edit">
                  Become an organizer
                </ButtonLink>
              )}
            </div>
          </Card>
          <Card variant="paper">
            <p className="poppin-eyebrow">Bring your good finds</p>
            <h2>My vendor applications</h2>
            <p>
              Apply to a local event with your business details, follow its
              status and see your confirmed markets.
            </p>
            <div className="poppin-actions">
              <ButtonLink to="/my-applications">My applications</ButtonLink>
              <ButtonLink variant="outline" to="/opportunities">
                Find a market
              </ButtonLink>
              <ButtonLink variant="ghost" to="/confirmed-events">
                Confirmed events
              </ButtonLink>
            </div>
          </Card>
        </div>
      </PageContainer>
    );
  const profile = resource.data?.profile;
  const owner = !!user && profile?.user === user._id;
  const name = profile
    ? "businessName" in profile
      ? profile.businessName
      : profile.name
    : "";
  const events = resource.data?.events || [];
  const visible = events.filter((event) =>
    tab === "past"
      ? event.eventState === "completed"
      : event.eventState !== "completed",
  );
  return (
    <PageContainer>
      <ResourceState {...resource} />
      {profile && (
        <>
          <ProfileHeader
            name={name}
            image={profile.logoUrl}
            city={profile.city}
            kind={kind || "Profile"}
          >
            {owner && (
              <>
                <ButtonLink
                  size="sm"
                  variant="outline"
                  to={
                    kind === "organizer"
                      ? "/organizer/profile/edit"
                      : "/profile/edit?section=vendor"
                  }
                >
                  Edit profile
                </ButtonLink>
                {kind === "organizer" ? (
                  <>
                    <ButtonLink size="sm" to="/events/new">
                      Create event ↗
                    </ButtonLink>
                    <ButtonLink size="sm" variant="outline" to="/my-events">
                      Manage events
                    </ButtonLink>
                    <ButtonLink size="sm" variant="ghost" to="/posts/new">
                      Post an update
                    </ButtonLink>
                  </>
                ) : (
                  <>
                    <ButtonLink size="sm" to="/my-applications">
                      My applications
                    </ButtonLink>
                    <ButtonLink
                      size="sm"
                      variant="outline"
                      to="/confirmed-events"
                    >
                      Confirmed events
                    </ButtonLink>
                  </>
                )}
              </>
            )}
          </ProfileHeader>
          <div className="poppin-profile-layout">
            <ProfileAbout profile={profile} name={name} />
            <div>
              <Tabs
                label={`${name} profile sections`}
                value={tab}
                onChange={setTab}
                items={[
                  {
                    value: "events",
                    label:
                      kind === "vendor" ? "Find us here" : "Upcoming events",
                  },
                  { value: "past", label: "Past events" },
                  ...(kind === "organizer"
                    ? [{ value: "updates", label: "Recent updates" }]
                    : []),
                ]}
              >
                {tab === "updates" ? (
                  <>
                    <ResourceState
                      loading={false}
                      error=""
                      empty={
                        !resource.data?.posts.length
                          ? "No updates posted yet. The next little announcement will appear here."
                          : ""
                      }
                    />
                    <div className="poppin-record-list">
                      {resource.data?.posts.map((post) => (
                        <EventPostCard key={post._id} post={post} />
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <ResourceState
                      loading={false}
                      error=""
                      empty={
                        !visible.length
                          ? "New plans are on their way. Explore the local noticeboard while you wait."
                          : ""
                      }
                      action={
                        <ButtonLink variant="outline" to="/discover">
                          Discover events
                        </ButtonLink>
                      }
                    />
                    <div className="poppin-discover-grid">
                      {visible.map((event) => (
                        <EventCard key={event._id} event={event} />
                      ))}
                    </div>
                  </>
                )}
              </Tabs>
            </div>
          </div>
        </>
      )}
    </PageContainer>
  );
}
