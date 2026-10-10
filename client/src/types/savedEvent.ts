import type { Event } from "./event";

export interface SavedEvent {
  eventId: string;
  savedAt: string;
  event: Event | null;
}
