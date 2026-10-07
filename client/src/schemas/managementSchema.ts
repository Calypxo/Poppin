import { z } from "zod";

export const venueTypes = [
  "Mall",
  "Outdoor Market",
  "Community Space",
  "Park",
  "Cafe",
  "Convention Venue",
  "Lifestyle Center",
  "Other",
] as const;

export const venueSchema = z.object({
  name: z.string().trim().min(1, "Venue name is required"),
  address: z.string().trim().min(1, "Address is required"),
  city: z.string().trim().min(1, "City is required"),
  province: z.string().trim().min(1, "Province is required"),
  venueType: z
    .string()
    .refine(
      (value) => venueTypes.some((type) => type === value),
      "Select a venue type",
    ),
  description: z.string().trim(),
});
export const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required"),
  description: z.string().trim(),
});
export type VenueFormData = z.infer<typeof venueSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
