import { z } from "zod";
export type ProfileSection = "personal" | "organizer" | "vendor";
export function profileSchema(section: ProfileSection) {
  return z
    .object({
      name: z.string().trim().min(2, "Enter your name").max(100),
      bio: z.string().max(2000),
      avatarUrl: z.string(),
      businessName: z.string().trim().max(150),
      description: z.string().trim().max(5000),
      logoUrl: z.string(),
      category: z.string(),
      products: z.string().trim().max(2000),
      city: z.string().trim().max(150),
      contactNumber: z.string().trim().max(50),
      email: z.string().trim(),
      socialMedia: z.string().max(500),
    })
    .superRefine((values, context) => {
      if (section !== "personal") {
        for (const field of [
          "businessName",
          "description",
          "city",
          "contactNumber",
        ] as const)
          if (!values[field])
            context.addIssue({
              code: "custom",
              path: [field],
              message: "Complete this field",
            });
        if (!z.email().safeParse(values.email).success)
          context.addIssue({
            code: "custom",
            path: ["email"],
            message: "Enter a valid contact email",
          });
      }
      if (section === "vendor")
        for (const field of ["category", "products"] as const)
          if (!values[field])
            context.addIssue({
              code: "custom",
              path: [field],
              message: "Complete this field",
            });
    });
}
export type ProfileFormData = z.infer<ReturnType<typeof profileSchema>>;
