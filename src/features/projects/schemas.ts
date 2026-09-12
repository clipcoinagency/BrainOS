import { z } from "zod";

/** ISO calendar date, "YYYY-MM-DD" (matches the Postgres `date` column). */
const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.");

export const projectStatusSchema = z.enum(["active", "completed", "archived"]);

/** Fields accepted when creating a project. Only a title is required — this
 * backs the "quick add" flow; everything else is set on the detail page. */
export const createProjectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(200, "Title is too long."),
});

/** Fields accepted when updating a project. All optional; only provided
 * fields change. `targetDate: null` explicitly clears the target date. */
export const updateProjectSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200).optional(),
  description: z.string().max(5000, "Description is too long.").optional(),
  status: projectStatusSchema.optional(),
  targetDate: isoDateSchema.nullable().optional(),
});

/** Fields accepted when creating a milestone within a project. */
export const createMilestoneSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(200, "Title is too long."),
});

export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
