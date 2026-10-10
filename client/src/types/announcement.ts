export interface AnnouncementEvent {
  organizer?: import("./event").Organizer;
  status?: string;
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
}

export interface Announcement {
  _id: string;

  event: AnnouncementEvent;

  title: string;
  content: string;

  type:
    | "announcement"
    | "vendor_call"
    | "lineup"
    | "general"
    | "schedule_update"
    | "reminder"
    | "important";

  imageUrl?: string;
  imageUrls?: string[];
  isPublished: boolean;

  publishedAt: string | null;

  createdAt: string;
  updatedAt: string;
}
