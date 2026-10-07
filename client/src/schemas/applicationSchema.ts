import { z } from "zod";

export const applicationSchema = z.object({
  businessName: z.string().trim().min(2, "Enter your business name").max(150),
  category: z.string().min(1, "Choose a business category"),
  products: z
    .string()
    .trim()
    .min(2, "Describe your products or services")
    .max(2000),
  businessDescription: z.string().trim().max(5000),
  contactNumber: z.string().trim().min(5, "Enter a contact number").max(50),
  email: z
    .string()
    .trim()
    .max(254)
    .pipe(z.email("Enter a valid contact email")),
  socialMedia: z.string().trim().max(500),
  notes: z.string().trim().max(2000, "Use at most 2000 characters"),
});
export type ApplicationFormData = z.infer<typeof applicationSchema>;
