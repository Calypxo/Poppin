import {
  useEffect,
  useState,
} from "react";

import api from "../api/client";

import type {
  Event,
} from "../types/event";

export default function useEvents() {
  const [events, setEvents] =
    useState<Event[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadEvents() {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get<Event[]>(
          "/events"
        );

      setEvents(response.data);
    } catch (err) {
      console.error(
        "Failed to load events:",
        err
      );

      setError(
        "Unable to load events."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  return {
    events,
    loading,
    error,
    reloadEvents: loadEvents,
  };
}