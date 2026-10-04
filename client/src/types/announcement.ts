export interface AnnouncementEvent {
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
    | "general"
    | "schedule_update"
    | "reminder"
    | "important";

  isPublished: boolean;

  publishedAt: string | null;

  createdAt: string;
  updatedAt: string;
}