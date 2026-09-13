import { z } from "zod";

/** Fields accepted when creating a meeting. Everything is optional — a
 * blank meeting ("Untitled") is a valid starting point, matching Notes. */
export const createMeetingSchema = z.object({
  title: z.string().max(200, "Title is too long.").optional(),
});

/** Fields accepted when updating a meeting. All optional; only provided
 * fields change. `scheduledAt: null` explicitly clears the scheduled time.
 * `scheduledAt` is a full ISO 8601 instant (from the browser's
 * `new Date(datetimeLocalValue).toISOString()`) — never a naive
 * "datetime-local" string, which has no timezone and would be ambiguous
 * once stored in a `timestamptz` column. */
export const updateMeetingSchema = z.object({
  title: z.string().max(200, "Title is too long.").optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  attendees: z.string().max(2000, "Attendees is too long.").optional(),
  notes: z.string().max(20_000, "Notes are too long.").optional(),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;
