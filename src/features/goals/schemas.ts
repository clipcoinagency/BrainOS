import { z } from "zod";

/** ISO calendar date, "YYYY-MM-DD" (matches the Postgres `date` column). */
const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.");

export const goalStatusSchema = z.enum(["active", "achieved", "archived"]);

/** Fields accepted when creating a goal. Only a title is required — this
 * backs the "quick add" flow; target, unit, and date are set afterward. */
export const createGoalSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(200, "Title is too long."),
});

/** Fields accepted when updating a goal. All optional; only provided fields
 * change. `targetDate: null` explicitly clears the target date. */
export const updateGoalSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200).optional(),
  description: z.string().max(5000, "Description is too long.").optional(),
  status: goalStatusSchema.optional(),
  targetValue: z
    .number()
    .finite()
    .positive("Target must be greater than 0.")
    .optional(),
  currentValue: z
    .number()
    .finite()
    .min(0, "Progress can't be negative.")
    .optional(),
  unit: z.string().trim().max(20, "Unit is too long.").optional(),
  targetDate: isoDateSchema.nullable().optional(),
});

export type GoalStatus = z.infer<typeof goalStatusSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
