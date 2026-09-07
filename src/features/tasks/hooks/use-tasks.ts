"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Task } from "@/lib/supabase/types";

import {
  createTask,
  deleteTask,
  listTasksAction,
  toggleTaskComplete,
  updateTask,
} from "../actions";
import type { CreateTaskInput, UpdateTaskInput } from "../schemas";

export const taskKeys = {
  all: ["tasks"] as const,
};

/** One TanStack Query mutation `scope` per task, shared by every mutation
 * that writes to that task (edits, completion toggle). Mutations sharing a
 * scope are serialized by TanStack Query, so a slow edit can't complete after
 * a newer one and revert the row, and a rapid double-click on the checkbox
 * can't persist the wrong final state. See the Notes feature's `use-notes.ts`
 * for the review finding this pattern fixes. */
function taskScope(id: string) {
  return { id: `task-${id}` };
}

/**
 * The tasks list, seeded with server-fetched `initialData` so there is no
 * loading flash on first paint.
 */
export function useTasksQuery(initialData: Task[]) {
  return useQuery({
    queryKey: taskKeys.all,
    queryFn: () => listTasksAction(),
    initialData,
  });
}

/** Create a task from a title (the "quick add" flow). */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: (result) => {
      if ("data" in result) {
        queryClient.invalidateQueries({ queryKey: taskKeys.all });
      }
    },
  });
}

/** Update one task's fields. Scoped to `taskId` — see {@link taskScope}. */
export function useUpdateTask(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    scope: taskScope(taskId),
    mutationFn: (input: UpdateTaskInput) => updateTask(taskId, input),
    onSuccess: (result) => {
      if ("data" in result) {
        queryClient.invalidateQueries({ queryKey: taskKeys.all });
      }
    },
  });
}

/**
 * Toggle completion with an optimistic update so the checkbox feels instant.
 * Shares its scope with {@link useUpdateTask} for the same task.
 */
export function useToggleTaskComplete(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    scope: taskScope(taskId),
    mutationFn: (isCompleted: boolean) =>
      toggleTaskComplete(taskId, isCompleted),
    onMutate: async (isCompleted) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const previous = queryClient.getQueryData<Task[]>(taskKeys.all);

      queryClient.setQueryData<Task[]>(taskKeys.all, (tasks) =>
        tasks?.map((task) =>
          task.id === taskId
            ? {
                ...task,
                is_completed: isCompleted,
                completed_at: isCompleted ? new Date().toISOString() : null,
              }
            : task,
        ),
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(taskKeys.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

/** Delete a task with an optimistic removal from the list. */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const previous = queryClient.getQueryData<Task[]>(taskKeys.all);

      queryClient.setQueryData<Task[]>(taskKeys.all, (tasks) =>
        tasks?.filter((task) => task.id !== id),
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(taskKeys.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
