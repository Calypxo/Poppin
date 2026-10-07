import { z } from "zod";
export function authSchema(registering: boolean) {
  return z
    .object({
      email: z.string().trim().pipe(z.email("Enter a valid email")),
      password: z
        .string()
        .min(8, "Use at least 8 characters")
        .refine(
          (value) => new TextEncoder().encode(value).length <= 72,
          "Use at most 72 bytes",
        ),
      name: z.string().trim().max(100),
      confirmPassword: z.string(),
    })
    .superRefine((values, context) => {
      if (registering && values.name.length < 2)
        context.addIssue({
          code: "custom",
          path: ["name"],
          message: "Enter your full name",
        });
      if (registering && values.password !== values.confirmPassword)
        context.addIssue({
          code: "custom",
          path: ["confirmPassword"],
          message: "Passwords must match",
        });
    });
}
export type AuthFormData = z.infer<ReturnType<typeof authSchema>>;
