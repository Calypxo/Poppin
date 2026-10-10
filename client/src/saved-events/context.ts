import { createContext, useContext } from "react";
import type { Event } from "../types/event";
import type { SavedEvent } from "../types/savedEvent";

export interface SavedEventsContextValue {
  entries: SavedEvent[];
  loading: boolean;
  error: string;
  pendingIds: ReadonlySet<string>;
  reload: () => void;
  toggle: (event: Event) => Promise<boolean>;
  remove: (eventId: string) => Promise<boolean>;
}

export const SavedEventsContext = createContext<SavedEventsContextValue | null>(null);
export function useSavedEvents() {
  const value = useContext(SavedEventsContext);
  if (!value) throw new Error("SavedEventsProvider is required");
  return value;
}
