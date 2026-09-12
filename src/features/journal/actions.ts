"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { requireUser } from "@/lib/supabase/require-user";
import type { JournalEntry } from "@/lib/supabase/types";

import { todayIsoDate } from "./lib/date";
import { createJournalEntrySchema, updateJournalEntrySchema } from "./schemas";
import type {
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
} from "./schemas";
import { getJournalEntry, listJournalEntries } from "./queries";

/** Discriminated result returned to the client. */
export type JournalResult<T> = { data: T } | { error: string };

const NOT_FOUND = "Journal entry not found.";

// `id` always originates from a route param or another action's own return
// value, but these are Server Actions — reachable by any authenticated
// browser via devtools or a hand-crafted request, not just through our UI.
// Validating the shape here turns a malformed id into our own generic
// message instead of a raw Postgres type-cast error surfacing to the client.
const journalEntryIdSchema = z.string().uuid();

// Postgres unique-violation error code, raised by
// `journal_entries_one_per_day` when a second insert targets a day that
// already has an entry.
const UNIQUE_VIOLATION = "23505";

function revalidateJournal(id?: string) {
  revalidatePath("/journal");
  if (id) revalidatePath(`/journal/${id}`);
}

/**
 * List the current user's journal entries. A "use server" bridge over
 * `queries.listJournalEntries` so Client Components (e.g. a TanStack Query
 * `queryFn`) can call it — direct imports of `queries.ts` are blocked by its
 * `server-only` guard.
 */
export async function listJournalEntriesAction(): Promise<JournalEntry[]> {
  return listJournalEntries();
}

/** Get one journal entry by id. See {@link listJournalEntriesAction} for why
 * this bridges `queries.ts`. */
export async function getJournalEntryAction(
  id: string,
): Promise<JournalEntry | null> {
  if (!journalEntryIdSchema.safeParse(id).success) return null;
  return getJournalEntry(id);
}

/**
 * Create a journal entry for a day and return it. `entryDate` should always
 * be supplied by the caller as the browser's own local "today" (see
 * `todayIsoDate()`) — the fallback to a server-computed `todayIsoDate()`
 * below only covers a caller that omits it entirely (e.g. a direct call to
 * this Server Action outside the shipped UI), since computing "today" inside
 * the server process would use the server's own timezone, not the user's.
 * `entryDateSchema` bounds any supplied date to within one day of the
 * server's UTC date, which comfortably covers every real timezone's "today"
 * while still rejecting an arbitrary backdated/postdated `entryDate` from a
 * hand-crafted request.
 *
 * At most one entry can exist per user per day (enforced by the
 * `journal_entries_one_per_day` unique constraint, not just app logic — this
 * function is reachable directly, and a client-side "does today already have
 * an entry?" check would still race a second tab or a double-click). If the
 * target day already has an entry, this returns that existing entry instead
 * of an error — from the caller's point of view, "create today's entry" and
 * "open today's entry" are the same action.
 */
export async function createJournalEntry(
  input: CreateJournalEntryInput = {},
): Promise<JournalResult<JournalEntry>> {
  const ctx = await requireUser("Journal entries");
  if ("error" in ctx) return { error: ctx.error };

  const parsed = createJournalEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the entry and try again." };
  }

  const { supabase, user } = ctx;
  const entryDate = parsed.data.entryDate ?? todayIsoDate();
  const row = {
    user_id: user.id,
    entry_date: entryDate,
    mood: parsed.data.mood,
    content: parsed.data.content ?? "",
  };

  const { data, error } = await supabase
    .from("journal_entries")
    .insert(row)
    .select()
    .single();

  if (!error) {
    revalidateJournal();
    return { data };
  }

  if (error.code === UNIQUE_VIOLATION) {
    const { data: existing } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("entry_date", entryDate)
      .maybeSingle();

    if (existing) return { data: existing };

    // The conflicting row was deleted between our failed insert and the
    // re-query above (e.g. another tab deleted today's entry in that
    // instant) — the day is free again, so retry once instead of surfacing a
    // spurious error for what is now an ordinary creation.
    const retry = await supabase
      .from("journal_entries")
      .insert(row)
      .select()
      .single();

    if (!retry.error) {
      revalidateJournal();
      return { data: retry.data };
    }
  }

  return { error: "Failed to create journal entry." };
}

/** Update an entry's mood and/or content. */
export async function updateJournalEntry(
  id: string,
  input: UpdateJournalEntryInput,
): Promise<JournalResult<JournalEntry>> {
  if (!journalEntryIdSchema.safeParse(id).success) return { error: NOT_FOUND };

  const ctx = await requireUser("Journal entries");
  if ("error" in ctx) return { error: ctx.error };

  const parsed = updateJournalEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the entry and try again." };
  }

  const { mood, content } = parsed.data;
  if (mood === undefined && content === undefined) {
    return { error: "Nothing to update." };
  }

  const { supabase, user } = ctx;
  const { data, error } = await supabase
    .from("journal_entries")
    .update({
      ...(mood !== undefined && { mood }),
      ...(content !== undefined && { content }),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  // No matching row (wrong owner, or deleted between click and request) and a
  // genuine database error both land here — .single() errors either way, and
  // callers only need to know the update didn't happen.
  if (error || !data) return { error: "Failed to update journal entry." };

  revalidateJournal(id);
  return { data };
}

/** Delete a journal entry. */
export async function deleteJournalEntry(
  id: string,
): Promise<JournalResult<{ id: string }>> {
  if (!journalEntryIdSchema.safeParse(id).success) return { error: NOT_FOUND };

  const ctx = await requireUser("Journal entries");
  if ("error" in ctx) return { error: ctx.error };

  const { supabase, user } = ctx;
  const { error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "Failed to delete journal entry." };

  revalidateJournal(id);
  return { data: { id } };
}
