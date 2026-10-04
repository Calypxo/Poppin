import { z } from "zod";

export const vendorCallSchema = z
  .object({
    event: z
      .string()
      .min(1, "Please select an event"),

    title: z
      .string()
      .min(3, "Title must be at least 3 characters"),

    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),

    applicationStartDate: z
      .string()
      .min(1, "Application start date is required"),

    applicationDeadline: z
      .string()
      .min(1, "Application deadline is required"),

    totalSlots: z.coerce
      .number()
      .min(1, "There must be at least 1 vendor slot"),

    boothFee: z.coerce
      .number()
      .min(0, "Booth fee cannot be negative"),

    boothSize: z.string().optional(),

    requirements: z.string().optional(),

    acceptedCategories: z
      .array(z.string())
      .min(1, "Select at least one category"),
  })
  .refine(
    (data) =>
      new Date(data.applicationDeadline) >=
      new Date(data.applicationStartDate),
    {
      message:
        "Application deadline cannot be earlier than the opening date",
      path: ["applicationDeadline"],
    }
  );

export type VendorCallFormInput =
  z.input<typeof vendorCallSchema>;

export type VendorCallFormData =
  z.output<typeof vendorCallSchema>;