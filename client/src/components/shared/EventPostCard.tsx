import { Link } from "react-router-dom";
import { ArrowUpRight, Clock3 } from "lucide-react";
import { useAuth } from "../../auth/context";
import type { Announcement } from "../../types/announcement";
import StatusBadge from "./StatusBadge";
import OrganizerIdentity from "./OrganizerIdentity";
import Card from "../ui/Card";
import { ButtonLink } from "../ui/Button";
import DropdownMenu from "../ui/DropdownMenu";

export default function EventPostCard({
  post,
  onDelete,
}: {
  post: Announcement;
  onDelete?: (post: Announcement) => void;
}) {
  const { user } = useAuth();
  const organizer = post.event.organizer;
  const owner = !!user && organizer?.user === user._id;
  const date = post.publishedAt || post.createdAt;
  return (
    <Card className="poppin-update-card">
      <div className="poppin-update-top">
        <div>
          {organizer && <OrganizerIdentity organizer={organizer} />}
          <Link
            className="poppin-update-event"
            to={"/events/" + post.event._id}
          >
            {post.event.title}
          </Link>
        </div>
        {owner && (
          <DropdownMenu
            label={"Actions for " + post.title}
            items={[
              {
                label: "Edit post",
                to: "/events/" + post.event._id + "/posts?edit=" + post._id,
              },
              ...(onDelete
                ? [
                    {
                      label: "Delete post",
                      danger: true,
                      onSelect: () => onDelete(post),
                    },
                  ]
                : []),
            ]}
          />
        )}
      </div>
      <div className="poppin-update-meta">
        <StatusBadge status={post.isPublished ? post.type : "draft"} />
        <time dateTime={date}>
          <Clock3 size={13} aria-hidden="true" />
          {new Date(date).toLocaleDateString("en-PH", {
            timeZone: "Asia/Manila",
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </time>
      </div>
      <h3>{post.title}</h3>
      <p className="poppin-preserve-lines">{post.content}</p>
      {post.imageUrl && (
        <img
          className="poppin-update-image"
          src={post.imageUrl}
          alt={post.title}
          loading="lazy"
        />
      )}
      <div className="poppin-update-footer">
        <ButtonLink
          size="sm"
          variant="ghost"
          to={"/events/" + post.event._id}
          icon={<ArrowUpRight size={16} aria-hidden="true" />}
        >
          View event
        </ButtonLink>
      </div>
    </Card>
  );
}
