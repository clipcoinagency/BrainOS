"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { requireUser } from "@/lib/supabase/require-user";
import type { Habit } from "@/lib/supabase/types";

import {
  completedDateSchema,
  createHabitSchema,
  updateHabitSchema,
} from "./schemas";
import type { CreateHabitInput, UpdateHabitInput } from "./schemas";
import { listHabits } from "./queries";
import type { HabitWithLogs } from "./queries";

/** Discriminated result returned to the client. */
export type HabitResult<T> = { data: T } | { error: string };

const NOT_FOUND = "Habit not found.";

// `id` always originates from a route param or another action's own return
// value, but these are Server Actions — reachable by any authenticated
// browser via devtools or a hand-crafted request, not just through our UI.
const habitIdSchema = z.string().uuid();

// Postgres unique-violation error code — raised by `habit_logs_one_per_day`
// when a log for that day already exists, e.g. a rapid double-click.
const UNIQUE_VIOLATION = "23505";

function revalidateHabits() {
  revalidatePath("/habits");
}

/** List the current user's habits. A "use server" bridge over
 * `queries.listHabits` so Client Components (e.g. a TanStack Query
 * `queryFn`) can call it — direct imports of `queries.ts` are blocked by its
 * `server-only` guard. */
export async function listHabitsAction(): Promise<HabitWithLogs[]> {
  return listHabits();
}

/** Create a habit. */
export async function createHabit(
  input: CreateHabitInput,
): Promise<HabitResult<Habit>> {
  const ctx = await requireUser("Habits");
  if ("error" in ctx) return { error: ctx.error };

  const parsed = createHabitSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Please check the habit and try again.",
    };
  }

  const { supabase, user } = ctx;
  const { data, error } = await supabase
    .from("habits")
    .insert({ user_id: user.id, title: parsed.data.title })
    .select()
    .single();

  if (error || !data) return { error: "Failed to create habit." };

  revalidateHabits();
  return { data };
}

/** Update a habit's title and/or description. */
export async function updateHabit(
  id: string,
  input: UpdateHabitInput,
): Promise<HabitResult<Habit>> {
  if (!habitIdSchema.safeParse(id).success) return { error: NOT_FOUND };

  const ctx = await requireUser("Habits");
  if ("error" in ctx) return { error: ctx.error };

  const parsed = updateHabitSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the habit and try again." };
  }

  const { title, description } = parsed.data;
  if (title === undefined && description === undefined) {
    return { error: "Nothing to update." };
  }

  const { supabase, user } = ctx;
  const { data, error } = await supabase
    .from("habits")
    .update({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !data) return { error: "Failed to update habit." };

  revalidateHabits();
  return { data };
}

/** Delete a habit (its logs cascade with it). */
export async function deleteHabit(
  id: string,
): Promise<HabitResult<{ id: string }>> {
  if (!habitIdSchema.safeParse(id).success) return { error: NOT_FOUND };

  const ctx = await requireUser("Habits");
  if ("error" in ctx) return { error: ctx.error };

  const { supabase, user } = ctx;
  const { error } = await supabase
    .from("habits")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "Failed to delete habit." };

  revalidateHabits();
  return { data: { id } };
}

/**
 * Mark a habit done (or not done) for a given day.
 *
 * `completedDate` must be the CALLER's own local "today" (see the habits
 * feature's `todayIsoDate`) — computing it here instead would use the
 * server process's own timezone, silently mis-dating the log (the same bug
 * class the journal feature's `createJournalEntry` fixes). The schema
 * bounds it to within one day of the server's UTC date, which covers every
 * real timezone while still rejecting an arbitrary date.
 *
 * Unlike `project_milestones`, `habit_logs`' own RLS INSERT policy only
 * checks the log row's own `user_id` — it can't see whether `habitId`
 * actually belongs to this caller. Verified explicitly below before
 * inserting, same defense-in-depth pattern as `createMilestone`.
 */
export async function toggleHabitLog(
  habitId: string,
  completedDate: string,
  completed: boolean,
): Promise<HabitResult<{ habitId: string; date: string; completed: boolean }>> {
  if (!habitIdSchema.safeParse(habitId).success) return { error: NOT_FOUND };

  const parsedDate = completedDateSchema.safeParse(completedDate);
  if (!parsedDate.success) {
    return { error: parsedDate.error.issues[0]?.message ?? "Invalid date." };
  }

  const ctx = await requireUser("Habits");
  if ("error" in ctx) return { error: ctx.error };

  const { supabase, user } = ctx;
  const date = parsedDate.data;

  if (completed) {
    const { data: habit } = await supabase
      .from("habits")
      .select("id")
      .eq("id", habitId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!habit) return { error: NOT_FOUND };

    const { error } = await supabase.from("habit_logs").insert({
      habit_id: habitId,
      user_id: user.id,
      completed_date: date,
    });
    // A unique-violation here just means it was already logged (e.g. a
    // rapid double-click) — the end state the caller wants is already true.
    if (error && error.code !== UNIQUE_VIOLATION) {
      return { error: "Failed to log habit." };
    }
  } else {
    const { error } = await supabase
      .from("habit_logs")
      .delete()
      .eq("habit_id", habitId)
      .eq("completed_date", date)
      .eq("user_id", user.id);
    if (error) return { error: "Failed to update habit." };
  }

  revalidateHabits();
  return { data: { habitId, date, completed } };
}
