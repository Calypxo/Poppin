import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import api from "../api/client";
import { useAuth } from "../auth/context";
import { useUI } from "../components/ui/context";
import { errorMessage } from "../hooks/useResource";
import type { Event } from "../types/event";
import type { SavedEvent } from "../types/savedEvent";
import { SavedEventsContext } from "./context";

// A new session instance immediately clears the previous account's saved list.
export default function SavedEventsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return <SavedEventsSession key={user?._id || "guest"} userId={user?._id}>
    {children}
  </SavedEventsSession>;
}

function SavedEventsSession({ userId, children }: { userId?: string; children: ReactNode }) {
  const [entries, setEntries] = useState<SavedEvent[]>([]);
  const [loading, setLoading] = useState(!!userId);
  const [error, setError] = useState("");
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());
  const [version, setVersion] = useState(0);
  const requestedVersion = useRef(0);
  const busy = useRef(new Set<string>());
  const mounted = useRef(false);
  const { confirm, toast } = useUI();
  const reload = useCallback(() => {
    if (!busy.current.size) {
      requestedVersion.current += 1;
      setLoading(true);
      setError("");
      setVersion(requestedVersion.current);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    // A page can request a refresh before the session's first effect runs.
    // Only the most recent request may start or update the visible state.
    if (!userId || version !== requestedVersion.current) return;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await api.get<SavedEvent[]>("/saved-events", { signal: controller.signal });
        if (!controller.signal.aborted && version === requestedVersion.current) setEntries(response.data);
      } catch (err) {
        if (!controller.signal.aborted && version === requestedVersion.current) setError(errorMessage(err));
      } finally {
        if (!controller.signal.aborted && version === requestedVersion.current) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [userId, version]);

  async function change(eventId: string, event?: Event) {
    if (!userId || loading || error || busy.current.has(eventId)) return false;
    busy.current.add(eventId);
    try {
      if (!event) {
        const title = entries.find((entry) => entry.eventId === eventId)?.event?.title;
        const confirmed = await confirm({
          title: "Remove saved event?",
          description: title
            ? `Remove "${title}" from your Saved Events?`
            : "Remove this unavailable event from your Saved Events?",
          confirmLabel: "Remove event",
          cancelLabel: "Keep saved",
        });
        if (!confirmed || !mounted.current) return false;
      }
      setPendingIds((current) => new Set([...current, eventId]));
      if (event) await api.put("/saved-events/" + eventId);
      else await api.delete("/saved-events/" + eventId);
      if (!mounted.current) return false;
      setEntries((current) => event
        ? [{ eventId, event, savedAt: new Date().toISOString() }, ...current.filter((item) => item.eventId !== eventId)]
        : current.filter((item) => item.eventId !== eventId));
      toast.success(event ? "Event saved. Find it in Saved Events." : "Event removed from Saved Events.");
      return true;
    } catch (err) {
      if (mounted.current) toast.error(errorMessage(err));
      return false;
    } finally {
      busy.current.delete(eventId);
      if (mounted.current) setPendingIds((current) => {
        const next = new Set(current);
        next.delete(eventId);
        return next;
      });
    }
  }

  return <SavedEventsContext.Provider value={{
    entries, loading, error, pendingIds, reload,
    toggle: (event) => change(event._id, entries.some((item) => item.eventId === event._id) ? undefined : event),
    remove: (eventId) => change(eventId),
  }}>{children}</SavedEventsContext.Provider>;
}
