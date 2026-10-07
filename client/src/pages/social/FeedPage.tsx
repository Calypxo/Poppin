import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import useResource, { errorMessage } from "../../hooks/useResource";
import type { FeedResponse } from "../../types/account";
import { useAuth } from "../../auth/context";
import ResourceState from "../../components/shared/ResourceState";
import EventCard from "../../components/events/EventCard";
import EventPostCard from "../../components/shared/EventPostCard";
import OrganizerIdentity from "../../components/shared/OrganizerIdentity";
import StatusBadge from "../../components/shared/StatusBadge";
import { PageContainer, PageHeader } from "../../components/layout/Page";
import Button, { ButtonLink } from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Alert from "../../components/ui/Alert";
import { useUI } from "../../components/ui/context";
import { WatercolorSticker } from "../../components/public/MarketDecorations";
export default function FeedPage() {
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState("");
  const { user } = useAuth();
  const { confirm, toast } = useUI();
  const resource = useResource<FeedResponse>(`/feed?page=${page}`);
  return (
    <PageContainer width="feed" className="poppin-feed-wide">
      <PageHeader
        eyebrow="From your local circle"
        title="What’s Popp’in"
        featured
        motif="croissant"
        description="Fresh plans, little updates and the people making our weekends."
        actions={
          user?.organizerId ? (
            <>
              <ButtonLink to="/events/new">Create an event ↗</ButtonLink>
              <ButtonLink variant="outline" to="/posts/new">
                Share an update
              </ButtonLink>
            </>
          ) : user ? (
            <ButtonLink to="/organizer/profile/edit">
              Become an organizer
            </ButtonLink>
          ) : undefined
        }
      />
      {actionError && (
        <Alert variant="error" onDismiss={() => setActionError("")}>
          {actionError}
        </Alert>
      )}
      <div className="poppin-feed-layout">
        <div>
          <ResourceState
            {...resource}
            empty={
              !resource.data?.items.length
                ? "The noticeboard is waiting for its first published event. Find your next plan in Discover."
                : ""
            }
            action={<ButtonLink to="/discover">Discover events</ButtonLink>}
          />
          <div className="poppin-record-list">
            {resource.data?.items.map((item) =>
              item.kind === "post" && item.post ? (
                <EventPostCard
                  key={item._id}
                  post={{ ...item.post, event: item.event }}
                  onDelete={async (post) => {
                    if (
                      !(await confirm({
                        title: `Delete “${post.title}”?`,
                        description:
                          "This update will be removed from your event and the shared feed.",
                        confirmLabel: "Delete post",
                        cancelLabel: "Keep post",
                      }))
                    )
                      return;
                    try {
                      await api.delete(`/posts/${post._id}`);
                      toast.success("Post deleted.");
                      resource.reload();
                    } catch (err) {
                      setActionError(errorMessage(err));
                    }
                  }}
                />
              ) : item.kind === "event" ? (
                <Card variant="social" key={item._id}>
                  <div className="poppin-post-meta poppin-social-identity">
                    <OrganizerIdentity organizer={item.event.organizer} />
                    <StatusBadge status="new event" />
                    <time dateTime={item.timestamp}>
                      {new Date(item.timestamp).toLocaleDateString("en-PH", {
                        timeZone: "Asia/Manila",
                      })}
                    </time>
                  </div>
                  <EventCard variant="social" event={item.event} />
                </Card>
              ) : (
                <Card variant="ticket" key={item._id}>
                  <div className="poppin-post-meta">
                    <OrganizerIdentity organizer={item.event.organizer} />
                    <StatusBadge status="vendor call" />
                    <time dateTime={item.timestamp}>
                      {new Date(item.timestamp).toLocaleDateString("en-PH", {
                        timeZone: "Asia/Manila",
                      })}
                    </time>
                  </div>
                  <h2>{item.vendorCall?.title}</h2>
                  <p>{item.vendorCall?.description}</p>
                  <p>
                    {item.event.title} · {item.event.venue?.city}
                  </p>
                  <div className="poppin-actions">
                    <ButtonLink
                      size="sm"
                      variant="outline"
                      to={`/events/${item.event._id}`}
                    >
                      View event ↗
                    </ButtonLink>
                    <ButtonLink size="sm" to="/opportunities">
                      View opportunity
                    </ButtonLink>
                  </div>
                </Card>
              ),
            )}
          </div>
          {resource.data && (
            <div className="poppin-actions">
              <Button
                variant="outline"
                disabled={page === 1 || resource.loading}
                onClick={() => setPage((p) => p - 1)}
              >
                Newer
              </Button>
              <span aria-live="polite">Page {page}</span>
              <Button
                disabled={!resource.data.hasMore || resource.loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Older
              </Button>
            </div>
          )}
        </div>
        <aside className="poppin-feed-aside">
          <span className="poppin-eyebrow">YOUR WEEKEND FIELD NOTES</span>
          <WatercolorSticker motif="croissant" className="poppin-heading-art" />
          <h2>A little out of the ordinary.</h2>
          <p>
            Browse the markets, meet local businesses, and save a little room
            for the weekend.
          </p>
          <div className="poppin-actions">
            <ButtonLink fullWidth size="sm" to="/discover">
              Find your next plan ↗
            </ButtonLink>
            <ButtonLink
              fullWidth
              size="sm"
              variant="outline"
              to="/opportunities"
            >
              Vendor opportunities
            </ButtonLink>
          </div>
          {!user && (
            <p className="mt-5">
              <Link to="/register">Join your local circle ↗</Link>
            </p>
          )}
        </aside>
      </div>
    </PageContainer>
  );
}
