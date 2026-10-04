import { z } from "zod";

export const trackApplicationSchema = z.object({
  applicationCode: z
    .string()
    .min(1, "Application code is required"),

  email: z
    .string()
    .email("Enter a valid email address"),
});

export type TrackApplicationFormData =
  z.infer<typeof trackApplicationSchema>;