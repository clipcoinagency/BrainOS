import { z } from "zod";

import { isRealCalendarDate, isWithinCreatableWindow } from "./lib/date";

const moodSchema = z.enum(["great", "good", "okay", "low", "rough"]);

/** ISO date (`YYYY-MM-DD`), matching the Postgres `date` column. A client is
 * expected to send its own local "today" here (see `todayIsoDate()`), so
 * this only accepts a real calendar date within one day of the server's UTC
 * date — wide enough for every real timezone's "today", narrow enough that
 * a hand-crafted request can't backdate or postdate an entry. */
const entryDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date.")
  .refine(isRealCalendarDate, "Invalid date.")
  .refine(isWithinCreatableWindow, "Entries can only be created for today.");

/** Fields accepted when creating an entry. `entryDate` defaults to today
 * server-side when omitted — see `todayIsoDate()` in `lib/date.ts`. */
export const createJournalEntrySchema = z.object({
  entryDate: entryDateSchema.optional(),
  mood: moodSchema.optional(),
  content: z.string().max(100_000, "Entry is too long.").optional(),
});

/** Fields accepted when updating an entry. `entryDate` is deliberately
 * excluded — an entry's day is fixed at creation, matching the "one entry per
 * day" model; nothing in the UI offers to move an entry to another day. */
export const updateJournalEntrySchema = z.object({
  mood: moodSchema.nullable().optional(),
  content: z.string().max(100_000, "Entry is too long.").optional(),
});

export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;
export type UpdateJournalEntryInput = z.infer<typeof updateJournalEntrySchema>;
