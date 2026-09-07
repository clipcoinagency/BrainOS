import "server-only";

import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Task } from "@/lib/supabase/types";

/**
 * List the current user's tasks. Ordering is a starting point only — the
 * client re-sorts (open tasks by priority/due date, completed tasks by most
 * recently completed) since that logic also has to react to optimistic
 * updates between refetches. See `useTasksQuery`.
 *
 * Returns an empty array (never throws) when Supabase is not configured or the
 * user is unauthenticated, so callers can render a normal empty state.
 *
 * Wrapped in React's `cache()` so multiple calls within one request share a
 * single fetch.
 */
export const listTasks = cache(async (): Promise<Task[]> => {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("tasks")
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
 * Get one task by id, scoped to the current user.
 *
 * Returns `null` if the task doesn't exist, belongs to someone else (RLS
 * already prevents the row from being returned), Supabase is unconfigured, or
 * the request fails.
 */
export const getTask = cache(async (id: string): Promise<Task | null> => {
  if (!isSupabaseConfigured) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    return data;
  } catch {
    return null;
  }
});
