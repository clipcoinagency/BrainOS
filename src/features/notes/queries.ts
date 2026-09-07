import "server-only";

import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Note } from "@/lib/supabase/types";

/**
 * List the current user's notes, pinned first, most recently updated first.
 *
 * Returns an empty array (never throws) when Supabase is not configured or the
 * user is unauthenticated, so callers can render a normal empty state.
 *
 * Wrapped in React's `cache()` so multiple calls within one request (e.g. a
 * page and its `generateMetadata`) share a single fetch.
 */
export const listNotes = cache(async (): Promise<Note[]> => {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) return [];
    return data;
  } catch {
    return [];
  }
});

/**
 * Get one note by id, scoped to the current user.
 *
 * Returns `null` if the note doesn't exist, belongs to someone else (RLS
 * already prevents the row from being returned — the two cases are
 * indistinguishable by design, so no information about other users' notes
 * leaks), Supabase is unconfigured, or the request fails.
 *
 * Wrapped in React's `cache()` — see {@link listNotes}.
 */
export const getNote = cache(async (id: string): Promise<Note | null> => {
  if (!isSupabaseConfigured) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    return data;
  } catch {
    return null;
  }
});
