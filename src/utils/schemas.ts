import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().email("Invalid email address").max(255, "Email is too long"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z.enum(["STUDENT", "MENTOR"]),
  city: z.string().min(2, "City name is too short").max(100).optional().or(z.literal("")),
  skills: z.string()
    .max(500, "Skills list is too long")
    .optional()
    .or(z.literal("")),
  bio: z.string()
    .max(1000, "Bio is too long")
    .optional()
    .or(z.literal("")),
  // Mentor specific fields
  experienceYears: z.union([z.string(), z.number()]).optional(),
  hourlyRate: z.union([z.string(), z.number()]).optional(),
}).superRefine((data, ctx) => {
  if (data.role === "MENTOR") {
    // strict validation for mentors
    if (!data.experienceYears || Number(data.experienceYears) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mentors must specify valid experience years",
        path: ["experienceYears"],
      });
    }
    if (!data.hourlyRate || Number(data.hourlyRate) < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mentors must specify a valid hourly rate",
        path: ["hourlyRate"],
      });
    }
  }
});

export type RegisterFormData = z.infer<typeof registerSchema>;
