import { useEffect, useState } from "react";
import api from "../api/client";
import type { Category, DiscoverEventsResponse, Event } from "../types/event";

interface Resource<T> {
  data: T[];
  loading: boolean;
  error: boolean;
}
const initial = { data: [], loading: true, error: false };

export default function useHomeEvents() {
  const [events, setEvents] = useState<Resource<Event>>(initial);
  const [featured, setFeatured] = useState<Resource<Event>>(initial);
  const [categories, setCategories] = useState<Resource<Category>>(initial);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setEvents((previous) => ({ ...previous, loading: true, error: false }));
      setFeatured((previous) => ({ ...previous, loading: true, error: false }));
      setCategories((previous) => ({
        ...previous,
        loading: true,
        error: false,
      }));
      // Each section can succeed independently; a category failure must not hide events.
      await Promise.all([
        api
          .get<DiscoverEventsResponse>("/events/discover", {
            signal: controller.signal,
          })
          .then(({ data }) => {
            if (!controller.signal.aborted)
              setEvents({
                data: data.events.filter(
                  (event) => event.status === "published",
                ),
                loading: false,
                error: false,
              });
          })
          .catch(() => {
            if (!controller.signal.aborted)
              setEvents({ data: [], loading: false, error: true });
          }),
        api
          .get<DiscoverEventsResponse>("/events/discover?featured=true", {
            signal: controller.signal,
          })
          .then(({ data }) => {
            if (!controller.signal.aborted)
              setFeatured({
                data: data.events.filter(
                  (event) => event.status === "published",
                ),
                loading: false,
                error: false,
              });
          })
          .catch(() => {
            if (!controller.signal.aborted)
              setFeatured({ data: [], loading: false, error: true });
          }),
        api
          .get<Category[]>("/categories", { signal: controller.signal })
          .then(({ data }) => {
            if (!controller.signal.aborted)
              setCategories({
                data: data.filter((category) => category.isActive !== false),
                loading: false,
                error: false,
              });
          })
          .catch(() => {
            if (!controller.signal.aborted)
              setCategories({ data: [], loading: false, error: true });
          }),
      ]);
    }
    void load();
    return () => controller.abort();
  }, [attempt]);

  return {
    events,
    featured,
    categories,
    retry: () => setAttempt((previous) => previous + 1),
  };
}
