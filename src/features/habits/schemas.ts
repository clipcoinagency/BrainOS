import { z } from "zod";

import { isRealCalendarDate, isWithinLoggableWindow } from "./lib/date";

export const createHabitSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(200, "Title is too long."),
});

export const updateHabitSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200).optional(),
  description: z.string().max(2000, "Description is too long.").optional(),
});

/** ISO date ("YYYY-MM-DD"), matching the Postgres `date` column. Bounded to
 * within one day (UTC) of "now" in actions.ts — see the journal feature's
 * identical `entryDateSchema` for why: a client legitimately sends its own
 * local "today", which can differ from the server's UTC date by at most one
 * day, never more. */
export const completedDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date.")
  .refine(isRealCalendarDate, "Invalid date.")
  .refine(isWithinLoggableWindow, "You can only log today.");

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
