import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Plus,
  Store,
} from "lucide-react";
import api from "../../api/client";
import useResource, { errorMessage } from "../../hooks/useResource";
import type { FeedResponse } from "../../types/account";
import { useAuth } from "../../auth/context";
import ResourceState from "../../components/shared/ResourceState";
import EventCard from "../../components/events/EventCard";
import EventPostCard from "../../components/shared/EventPostCard";
import OrganizerIdentity from "../../components/shared/OrganizerIdentity";
import StatusBadge from "../../components/shared/StatusBadge";
import VendorOpportunityCard from "../../components/vendors/VendorOpportunityCard";
import { PageContainer, PageHeader } from "../../components/layout/Page";
import Button, { ButtonLink } from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import { useUI } from "../../components/ui/context";
import OrganizerHighlights from "../../components/social/OrganizerHighlights";

export default function FeedPage() {
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState("");
  const { user } = useAuth();
  const { confirm, toast } = useUI();
  const resource = useResource<FeedResponse>("/feed?page=" + page);
  return (
    <PageContainer className="poppin-news-page">
      <PageHeader
        eyebrow="THE LATEST FROM YOUR LOCAL SCENE"
        title="What’s Popp’in."
        featured
        motif="book-stack"
        description="Fresh events, news from the organizers and new places to bring your business."
        actions={
          user?.organizerId ? (
            <>
              <ButtonLink
                to="/events/new"
                icon={<Plus size={17} aria-hidden="true" />}
              >
                Create an event
              </ButtonLink>
              <ButtonLink variant="outline" to="/posts/new">
                Post an update
              </ButtonLink>
            </>
          ) : user ? (
            <ButtonLink variant="outline" to="/organizer/profile/edit">
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
      <OrganizerHighlights events={resource.data?.items.map(item => item.event)} />
      <div className="poppin-news-layout">
        <div>
          <div className="poppin-stream-heading">
            <span className="poppin-live-dot" aria-hidden="true" />
            <h2>The local noticeboard</h2>
            <span>Latest first</span>
          </div>
          <ResourceState
            {...resource}
            empty={
              !resource.data?.items.length
                ? "Fresh plans are on their way. Discover the events already around you."
                : ""
            }
            action={<ButtonLink to="/discover">Discover events</ButtonLink>}
          />
          <div className="poppin-news-stream">
            {resource.data?.items.map((item) =>
              item.kind === "post" && item.post ? (
                <EventPostCard
                  key={item._id}
                  post={{ ...item.post, event: item.event }}
                  onDelete={async (post) => {
                    if (
                      !(await confirm({
                        title: "Delete “" + post.title + "”?",
                        description:
                          "This update will be removed from your event and the shared feed.",
                        confirmLabel: "Delete post",
                        cancelLabel: "Keep post",
                      }))
                    )
                      return;
                    try {
                      await api.delete("/posts/" + post._id);
                      toast.success("Post deleted.");
                      resource.reload();
                    } catch (err) {
                      setActionError(errorMessage(err));
                    }
                  }}
                />
              ) : item.kind === "event" ? (
                <section className="poppin-feed-event" key={item._id}>
                  <div className="poppin-feed-entry-heading">
                    <OrganizerIdentity organizer={item.event.organizer} />
                    <StatusBadge status="new event" />
                    <time dateTime={item.timestamp}>
                      {new Date(item.timestamp).toLocaleDateString("en-PH", {
                        timeZone: "Asia/Manila",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                  <EventCard variant="social" event={item.event} />
                </section>
              ) : item.vendorCall ? (
                <section className="poppin-feed-recruitment" key={item._id}>
                  <VendorOpportunityCard
                    call={{ ...item.vendorCall, event: item.event }}
                    availability={item.vendorCall}
                  />
                </section>
              ) : null,
            )}
          </div>
          {resource.data && (
            <nav
              className="poppin-feed-pagination"
              aria-label="Noticeboard pages"
            >
              <Button
                variant="outline"
                disabled={page === 1 || resource.loading}
                onClick={() => setPage((value) => value - 1)}
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Newer
              </Button>
              <span aria-live="polite">Page {page}</span>
              <Button
                variant="outline"
                disabled={!resource.data.hasMore || resource.loading}
                onClick={() => setPage((value) => value + 1)}
              >
                Older
                <ArrowRight size={16} aria-hidden="true" />
              </Button>
            </nav>
          )}
        </div>
        <aside className="poppin-news-aside">
          <div className="poppin-aside-plan">
            <span className="poppin-section-icon">
              <CalendarDays size={26} aria-hidden="true" />
            </span>
            <p className="poppin-eyebrow">LESS SCROLLING. MORE GOING.</p>
            <h2>Make room for a good weekend.</h2>
            <p>
              Your next favorite market, coffee or local find is closer than you
              think.
            </p>
            <ButtonLink
              fullWidth
              to="/discover"
              icon={<ArrowUpRight size={17} aria-hidden="true" />}
            >
              Find your next plan
            </ButtonLink>
          </div>
          <div className="poppin-aside-business">
            <Store size={25} aria-hidden="true" />
            <h3>Bring your business along.</h3>
            <p>
              Find an event, send your application and make your next local
              connection.
            </p>
            <ButtonLink
              size="sm"
              variant="ghost"
              to="/opportunities"
              icon={<ArrowUpRight size={16} aria-hidden="true" />}
            >
              Explore opportunities
            </ButtonLink>
          </div>
          {!user && (
            <div className="poppin-aside-signup">
              <p>One account. A whole local scene.</p>
              <ButtonLink size="sm" variant="outline" fullWidth to="/register">
                Join POPP’IN
              </ButtonLink>
            </div>
          )}
        </aside>
      </div>
    </PageContainer>
  );
}
