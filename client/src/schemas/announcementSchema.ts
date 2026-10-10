import { z } from "zod";
import { MAX_POST_IMAGES } from "../utils/announcementImages";

export const announcementSchema = z.object({
  imageUrls: z.array(z.string().min(1)).max(MAX_POST_IMAGES, `Add up to ${MAX_POST_IMAGES} images to one update.`),
  event: z.string().min(1, "Please select an event"),

  title: z.string().min(3, "Title must be at least 3 characters"),

  content: z.string().min(10, "Announcement must be at least 10 characters"),

  type: z.enum([
    "announcement",
    "vendor_call",
    "lineup",
    "general",
    "schedule_update",
    "reminder",
    "important",
  ]),
});

export type AnnouncementFormData = z.infer<typeof announcementSchema>;
