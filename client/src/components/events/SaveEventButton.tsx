import { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bookmark, BookmarkCheck, RefreshCw } from "lucide-react";
import { useAuth } from "../../auth/context";
import { useSavedEvents } from "../../saved-events/context";
import type { Event } from "../../types/event";
import Button from "../ui/Button";

export default function SaveEventButton({ event, onRemoved }: {
  event: Event;
  onRemoved?: () => void;
}) {
  const { user, loading: restoring } = useAuth();
  const saved = useSavedEvents();
  const navigate = useNavigate();
  const location = useLocation();
  const button = useRef<HTMLButtonElement>(null);
  const isSaved = saved.entries.some((item) => item.eventId === event._id);
  const pending = saved.pendingIds.has(event._id);

  if (event.status === "draft" || (!isSaved && event.status === "cancelled")) return null;
  if (user && saved.error) return <Button variant="outline" size="sm"
    icon={<RefreshCw size={16} aria-hidden="true" />} onClick={saved.reload}
    aria-label={`Retry loading saved events for ${event.title}`}>Retry saved events</Button>;

  return <Button ref={button} size="sm" variant={isSaved ? "secondary" : "primary"}
    className="poppin-save-event" aria-pressed={isSaved}
    aria-label={`${isSaved ? "Remove" : "Save"} ${event.title}${isSaved ? " from Saved Events" : " to Saved Events"}`}
    loading={pending} disabled={restoring || (!!user && saved.loading)}
    icon={isSaved ? <BookmarkCheck size={17} aria-hidden="true" /> : <Bookmark size={17} aria-hidden="true" />}
    onClick={async () => {
      if (!user) {
        navigate("/login", { state: { from: location.pathname + location.search + location.hash } });
        return;
      }
      const hadFocus = document.activeElement === button.current;
      const changed = await saved.toggle(event);
      if (hadFocus) requestAnimationFrame(() => {
        if (changed && isSaved && onRemoved) onRemoved();
        else button.current?.focus();
      });
    }}>
    {pending ? (isSaved ? "Removing…" : "Saving…") : isSaved ? (onRemoved ? "Remove" : "Saved") : "Save event"}
  </Button>;
}
