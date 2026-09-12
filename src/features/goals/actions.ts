"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { requireUser } from "@/lib/supabase/require-user";
import type { Goal } from "@/lib/supabase/types";

import { createGoalSchema, updateGoalSchema } from "./schemas";
import type { CreateGoalInput, UpdateGoalInput } from "./schemas";
import { getGoal, listGoals } from "./queries";

/** Discriminated result returned to the client. */
export type GoalResult<T> = { data: T } | { error: string };

const NOT_FOUND = "Goal not found.";

// Server Actions are reachable by any authenticated browser (devtools, a
// hand-crafted request), not just through our UI — validate `id`'s shape so a
// malformed value fails with our own generic message instead of a raw
// Postgres type-cast error. Mirrors the notes/tasks features.
const goalIdSchema = z.string().uuid();

function revalidateGoals() {
  revalidatePath("/goals");
}

/**
 * List the current user's goals. A "use server" bridge over
 * `queries.listGoals` so Client Components (e.g. a TanStack Query `queryFn`)
 * can call it — direct imports of `queries.ts` are blocked by its
 * `server-only` guard.
 */
export async function listGoalsAction(): Promise<Goal[]> {
  return listGoals();
}

/** Get one goal by id. See {@link listGoalsAction} for why this bridges `queries.ts`. */
export async function getGoalAction(id: string): Promise<Goal | null> {
  if (!goalIdSchema.safeParse(id).success) return null;
  return getGoal(id);
}

/** Create a goal from just a title (the "quick add" flow). */
export async function createGoal(
  input: CreateGoalInput,
): Promise<GoalResult<Goal>> {
  const ctx = await requireUser("Goals");
  if ("error" in ctx) return { error: ctx.error };

  const parsed = createGoalSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Please check the goal and try again.",
    };
  }

  const { supabase, user } = ctx;
  const { data, error } = await supabase
    .from("goals")
    .insert({ user_id: user.id, title: parsed.data.title })
    .select()
    .single();

  if (error || !data) return { error: "Failed to create goal." };

  revalidateGoals();
  return { data };
}

/** Update a goal's title, description, status, progress, unit, and/or date. */
export async function updateGoal(
  id: string,
  input: UpdateGoalInput,
): Promise<GoalResult<Goal>> {
  if (!goalIdSchema.safeParse(id).success) return { error: NOT_FOUND };

  const ctx = await requireUser("Goals");
  if ("error" in ctx) return { error: ctx.error };

  const parsed = updateGoalSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Please check the goal and try again.",
    };
  }

  const {
    title,
    description,
    status,
    targetValue,
    currentValue,
    unit,
    targetDate,
  } = parsed.data;
  if (
    title === undefined &&
    description === undefined &&
    status === undefined &&
    targetValue === undefined &&
    currentValue === undefined &&
    unit === undefined &&
    targetDate === undefined
  ) {
    return { error: "Nothing to update." };
  }

  const { supabase, user } = ctx;
  const { data, error } = await supabase
    .from("goals")
    .update({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(targetValue !== undefined && { target_value: targetValue }),
      ...(currentValue !== undefined && { current_value: currentValue }),
      ...(unit !== undefined && { unit }),
      ...(targetDate !== undefined && { target_date: targetDate }),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  // No matching row (wrong owner, or deleted between click and request) and a
  // genuine database error both land here — .single() errors either way, and
  // callers only need to know the update didn't happen.
  if (error || !data) return { error: "Failed to update goal." };

  revalidateGoals();
  return { data };
}

/** Set a goal's current progress value. Thin wrapper over {@link updateGoal}. */
export async function updateGoalProgress(
  id: string,
  currentValue: number,
): Promise<GoalResult<Goal>> {
  return updateGoal(id, { currentValue });
}

/** Delete a goal. */
export async function deleteGoal(
  id: string,
): Promise<GoalResult<{ id: string }>> {
  if (!goalIdSchema.safeParse(id).success) return { error: NOT_FOUND };

  const ctx = await requireUser("Goals");
  if ("error" in ctx) return { error: ctx.error };

  const { supabase, user } = ctx;
  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "Failed to delete goal." };

  revalidateGoals();
  return { data: { id } };
}
