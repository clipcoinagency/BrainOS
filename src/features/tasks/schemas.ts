import { z } from "zod";

/** ISO calendar date, "YYYY-MM-DD" (matches the Postgres `date` column). */
const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.");

export const taskPrioritySchema = z.enum(["none", "low", "medium", "high"]);

/** Fields accepted when creating a task. Only a title is required — this
 * backs the "quick add" flow; priority and due date can be set afterward. */
export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(200, "Title is too long."),
});

/** Fields accepted when updating a task. All optional; only provided fields
 * change. `dueDate: null` explicitly clears the due date. */
export const updateTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200).optional(),
  description: z.string().max(5000, "Description is too long.").optional(),
  priority: taskPrioritySchema.optional(),
  dueDate: isoDateSchema.nullable().optional(),
  isCompleted: z.boolean().optional(),
});

export type TaskPriority = z.infer<typeof taskPrioritySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
