import { z } from "zod";

export const eventSchema = z
  .object({
    title: z.string().min(3, "Event title must be at least 3 characters"),

    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),

    venue: z.string().min(1, "Please select a venue"),

    categories: z
      .array(z.string())
      .min(1, "Please select at least one category"),

    startDate: z.string().min(1, "Start date is required"),

    endDate: z.string().min(1, "End date is required"),

    startTime: z.string().min(1, "Start time is required"),

    endTime: z.string().min(1, "End time is required"),

    posterUrl: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) {
        return true;
      }

      return new Date(data.endDate) >= new Date(data.startDate);
    },
    {
      message: "End date cannot be earlier than start date",
      path: ["endDate"],
    },
  );

export type EventFormData = z.infer<typeof eventSchema>;
