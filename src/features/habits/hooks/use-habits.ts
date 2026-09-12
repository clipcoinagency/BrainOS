"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createHabit,
  deleteHabit,
  listHabitsAction,
  toggleHabitLog,
  updateHabit,
} from "../actions";
import type { HabitWithLogs } from "../queries";
import type { CreateHabitInput, UpdateHabitInput } from "../schemas";

export const habitKeys = {
  all: ["habits"] as const,
};

/** One TanStack Query mutation `scope` per habit, shared by every mutation
 * that writes to it (edit, log toggle) — see the notes feature's
 * `use-notes.ts` for why same-entity writes need to be serialized this way. */
function habitScope(id: string) {
  return { id: `habit-${id}` };
}

/** The habits list, seeded with server-fetched `initialData` so there is no
 * loading flash on first paint. */
export function useHabitsQuery(initialData: HabitWithLogs[]) {
  return useQuery({
    queryKey: habitKeys.all,
    queryFn: () => listHabitsAction(),
    initialData,
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateHabitInput) => createHabit(input),
    onSuccess: (result) => {
      if ("data" in result) {
        queryClient.invalidateQueries({ queryKey: habitKeys.all });
      }
    },
  });
}

export function useUpdateHabit(habitId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    scope: habitScope(habitId),
    mutationFn: (input: UpdateHabitInput) => updateHabit(habitId, input),
    onSuccess: (result) => {
      if ("data" in result) {
        queryClient.invalidateQueries({ queryKey: habitKeys.all });
      }
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteHabit(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: habitKeys.all });
      const previous = queryClient.getQueryData<HabitWithLogs[]>(habitKeys.all);

      queryClient.setQueryData<HabitWithLogs[]>(habitKeys.all, (habits) =>
        habits?.filter((habit) => habit.id !== id),
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(habitKeys.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
    },
  });
}

/** Toggle a habit's completion for one day, with an optimistic update to
 * that habit's `recentDates` so the streak/week-strip react instantly. */
export function useToggleHabitLog(habitId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    scope: habitScope(habitId),
    mutationFn: ({ date, completed }: { date: string; completed: boolean }) =>
      toggleHabitLog(habitId, date, completed),
    onMutate: async ({ date, completed }) => {
      await queryClient.cancelQueries({ queryKey: habitKeys.all });
      const previous = queryClient.getQueryData<HabitWithLogs[]>(habitKeys.all);

      queryClient.setQueryData<HabitWithLogs[]>(habitKeys.all, (habits) =>
        habits?.map((habit) =>
          habit.id === habitId
            ? {
                ...habit,
                recentDates: completed
                  ? [...habit.recentDates, date]
                  : habit.recentDates.filter((d) => d !== date),
              }
            : habit,
        ),
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(habitKeys.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
    },
  });
}
