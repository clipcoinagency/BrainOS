import { z } from "zod";

export const createClientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(200, "Name is too long."),
});

export const updateClientSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(200).optional(),
  company: z.string().max(200, "Company is too long.").optional(),
  email: z
    .union([z.literal(""), z.string().trim().email("Enter a valid email.")])
    .optional(),
  phone: z.string().max(50, "Phone is too long.").optional(),
  notes: z.string().max(5000, "Notes are too long.").optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
