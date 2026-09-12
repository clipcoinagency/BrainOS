import "server-only";

import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Habit } from "@/lib/supabase/types";

/** How far back to fetch completion history — comfortably supports a
 * year-plus streak without the query growing unbounded over time. The exact
 * boundary uses the server's own clock; unlike "which single day is this"
 * logic elsewhere, a coarse history window doesn't need the caller's
 * timezone (being off by one day here just means fetching 399 or 401 days,
 * not a wrong answer). */
const HISTORY_DAYS = 400;

export interface HabitWithLogs extends Habit {
  /** Every date (within `HISTORY_DAYS`) this habit was completed, as
   * "YYYY-MM-DD" strings in no particular order. */
  recentDates: string[];
}

/**
 * List the current user's habits with their recent completion history.
 *
 * A separate `habit_logs` query (not a PostgREST embedded aggregate, to
 * avoid syntax risk that couldn't be live-tested) reduced client-side into a
 * `Map<habit_id, dates[]>` — same approach as the projects feature's
 * milestone counts.
 *
 * Returns an empty array (never throws) when Supabase is not configured or
 * the user is unauthenticated.
 */
export const listHabits = cache(async (): Promise<HabitWithLogs[]> => {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const since = new Date();
    since.setDate(since.getDate() - HISTORY_DAYS);
    const sinceIso = since.toISOString().slice(0, 10);

    const [habitsResult, logsResult] = await Promise.all([
      supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("habit_logs")
        .select("habit_id, completed_date")
        .eq("user_id", user.id)
        .gte("completed_date", sinceIso),
    ]);

    if (habitsResult.error) return [];

    const datesByHabit = new Map<string, string[]>();
    for (const log of logsResult.data ?? []) {
      const dates = datesByHabit.get(log.habit_id) ?? [];
      dates.push(log.completed_date);
      datesByHabit.set(log.habit_id, dates);
    }

    return habitsResult.data.map((habit) => ({
      ...habit,
      recentDates: datesByHabit.get(habit.id) ?? [],
    }));
  } catch {
    return [];
  }
});
