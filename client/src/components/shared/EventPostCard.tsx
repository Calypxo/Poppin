import { Link } from "react-router-dom";
import { useAuth } from "../../auth/context";
import type { Announcement } from "../../types/announcement";
import StatusBadge from "./StatusBadge";
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
  return (
    <Card variant="social" className="poppin-post">
      <div className="poppin-post-top">
        <div className="poppin-person">
          <span className="poppin-avatar poppin-avatar-small">
            {organizer?.logoUrl ? (
              <img src={organizer.logoUrl} alt={`${organizer.name} logo`} />
            ) : (
              organizer?.name?.slice(0, 2) || "P’"
            )}
          </span>
          <div>
            {organizer && (
              <Link to={`/organizers/${organizer._id}`}>{organizer.name}</Link>
            )}
            <p>
              <Link to={`/events/${post.event._id}`}>{post.event.title}</Link>
            </p>
          </div>
        </div>
        {owner && (
          <DropdownMenu
            label={`Actions for ${post.title}`}
            items={[
              {
                label: "Edit post",
                to: `/events/${post.event._id}/posts?edit=${post._id}`,
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
      <div className="poppin-post-meta">
        <StatusBadge status={post.isPublished ? post.type : "draft"} />
        <time dateTime={post.publishedAt || post.createdAt}>
          {new Date(post.publishedAt || post.createdAt).toLocaleString("en-PH")}
        </time>
      </div>
      <h3>{post.title}</h3>
      <p className="poppin-preserve-lines">{post.content}</p>
      {post.imageUrl && (
        <img
          className="poppin-post-image"
          src={post.imageUrl}
          alt={post.title}
          loading="lazy"
        />
      )}
      <div className="poppin-actions">
        <ButtonLink
          size="sm"
          variant="outline"
          to={`/events/${post.event._id}`}
        >
          View event ↗
        </ButtonLink>
      </div>
    </Card>
  );
}
