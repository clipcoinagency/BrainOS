import "server-only";

import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { JournalEntry } from "@/lib/supabase/types";

/**
 * List the current user's journal entries, most recent day first.
 *
 * Returns an empty array (never throws) when Supabase is not configured or
 * the user is unauthenticated, so callers can render a normal empty state.
 *
 * Wrapped in React's `cache()` so multiple calls within one request (e.g. a
 * page and its `generateMetadata`) share a single fetch.
 */
export const listJournalEntries = cache(async (): Promise<JournalEntry[]> => {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false });

    if (error) return [];
    return data;
  } catch {
    return [];
  }
});

/**
 * Get one journal entry by id, scoped to the current user.
 *
 * Returns `null` if the entry doesn't exist, belongs to someone else (RLS
 * already prevents the row from being returned — the two cases are
 * indistinguishable by design), Supabase is unconfigured, or the request
 * fails.
 *
 * Wrapped in React's `cache()` — see {@link listJournalEntries}.
 */
export const getJournalEntry = cache(
  async (id: string): Promise<JournalEntry | null> => {
    if (!isSupabaseConfigured) return null;

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      return data;
    } catch {
      return null;
    }
  },
);
