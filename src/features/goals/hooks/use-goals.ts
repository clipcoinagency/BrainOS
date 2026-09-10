"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Goal } from "@/lib/supabase/types";

import {
  createGoal,
  deleteGoal,
  listGoalsAction,
  updateGoal,
  updateGoalProgress,
} from "../actions";
import type { CreateGoalInput, UpdateGoalInput } from "../schemas";

export const goalKeys = {
  all: ["goals"] as const,
};

/** One TanStack Query mutation `scope` per goal, shared by every mutation
 * that writes to that goal (edits, progress steps). Same-scope mutations are
 * serialized by TanStack Query, so a slow edit can't complete after a newer
 * one and revert the row, and rapid progress clicks can't land out of order.
 * See the Notes feature's use-notes.ts for the review finding this fixes. */
function goalScope(id: string) {
  return { id: `goal-${id}` };
}

/**
 * The goals list, seeded with server-fetched `initialData` so there is no
 * loading flash on first paint.
 */
export function useGoalsQuery(initialData: Goal[]) {
  return useQuery({
    queryKey: goalKeys.all,
    queryFn: () => listGoalsAction(),
    initialData,
  });
}

/** Create a goal from a title (the "quick add" flow). */
export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGoalInput) => createGoal(input),
    onSuccess: (result) => {
      if ("data" in result) {
        queryClient.invalidateQueries({ queryKey: goalKeys.all });
      }
    },
  });
}

/** Update one goal's fields. Scoped to `goalId` — see {@link goalScope}. */
export function useUpdateGoal(goalId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    scope: goalScope(goalId),
    mutationFn: (input: UpdateGoalInput) => updateGoal(goalId, input),
    onSuccess: (result) => {
      if ("data" in result) {
        queryClient.invalidateQueries({ queryKey: goalKeys.all });
      }
    },
  });
}

/**
 * Step a goal's progress with an optimistic update so the bar moves
 * instantly. Shares its scope with {@link useUpdateGoal} for the same goal.
 */
export function useUpdateGoalProgress(goalId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    scope: goalScope(goalId),
    mutationFn: (currentValue: number) =>
      updateGoalProgress(goalId, currentValue),
    onMutate: async (currentValue) => {
      await queryClient.cancelQueries({ queryKey: goalKeys.all });
      const previous = queryClient.getQueryData<Goal[]>(goalKeys.all);

      queryClient.setQueryData<Goal[]>(goalKeys.all, (goals) =>
        goals?.map((goal) =>
          goal.id === goalId ? { ...goal, current_value: currentValue } : goal,
        ),
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(goalKeys.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
    },
  });
}

/** Delete a goal with an optimistic removal from the list. */
export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteGoal(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: goalKeys.all });
      const previous = queryClient.getQueryData<Goal[]>(goalKeys.all);

      queryClient.setQueryData<Goal[]>(goalKeys.all, (goals) =>
        goals?.filter((goal) => goal.id !== id),
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(goalKeys.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
    },
  });
}
