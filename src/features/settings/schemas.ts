import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Name can't be empty.")
    .max(120, "Name is too long."),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
