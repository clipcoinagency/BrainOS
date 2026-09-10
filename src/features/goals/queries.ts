import "server-only";

import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Goal } from "@/lib/supabase/types";

/**
 * List the current user's goals. Ordering is a starting point only — the
 * client re-sorts (active goals by target date, then achieved/archived) since
 * that logic also has to react to optimistic updates between refetches.
 *
 * Returns an empty array (never throws) when Supabase is not configured or the
 * user is unauthenticated, so callers can render a normal empty state.
 *
 * Wrapped in React's `cache()` so multiple calls within one request share a
 * single fetch.
 */
export const listGoals = cache(async (): Promise<Goal[]> => {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return [];
    return data;
  } catch {
    return [];
  }
});

/**
 * Get one goal by id, scoped to the current user.
 *
 * Returns `null` if the goal doesn't exist, belongs to someone else (RLS
 * already prevents the row from being returned), Supabase is unconfigured, or
 * the request fails.
 */
export const getGoal = cache(async (id: string): Promise<Goal | null> => {
  if (!isSupabaseConfigured) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("goals")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    return data;
  } catch {
    return null;
  }
});
