import { z } from "zod";

/** Fields accepted when creating a note. Everything is optional — a blank note
 * ("Untitled") is a valid starting point, matching the "New note" quick action. */
export const createNoteSchema = z.object({
  title: z.string().max(200, "Title is too long.").optional(),
  content: z.string().max(100_000, "Note is too long.").optional(),
});

/** Fields accepted when updating a note. All optional; only provided fields change. */
export const updateNoteSchema = z.object({
  title: z.string().max(200, "Title is too long.").optional(),
  content: z.string().max(100_000, "Note is too long.").optional(),
  isPinned: z.boolean().optional(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
