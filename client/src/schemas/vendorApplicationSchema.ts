import { z } from "zod";

export const vendorApplicationSchema = z.object({
  businessName: z
    .string()
    .min(2, "Business name is required"),

  representativeName: z
    .string()
    .min(2, "Representative name is required"),

  email: z
    .string()
    .email("Enter a valid email address"),

  contactNumber: z
    .string()
    .min(7, "Contact number is required"),

  category: z
    .string()
    .min(1, "Please select a category"),

  products: z
    .string()
    .min(2, "Please enter your products or services"),

  businessDescription: z
    .string()
    .min(
      10,
      "Business description must be at least 10 characters"
    ),

  socialMedia: z.string().optional(),

  notes: z.string().optional(),
});

export type VendorApplicationFormData =
  z.infer<typeof vendorApplicationSchema>;