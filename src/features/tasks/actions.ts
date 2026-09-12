"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { requireUser } from "@/lib/supabase/require-user";
import type { Task } from "@/lib/supabase/types";

import { createTaskSchema, updateTaskSchema } from "./schemas";
import type { CreateTaskInput, UpdateTaskInput } from "./schemas";
import { getTask, listTasks } from "./queries";

/** Discriminated result returned to the client. */
export type TaskResult<T> = { data: T } | { error: string };

const NOT_FOUND = "Task not found.";

// Server Actions are reachable by any authenticated browser (devtools, a
// hand-crafted request), not just through our UI — validate `id`'s shape so a
// malformed value fails with our own generic message instead of a raw
// Postgres type-cast error. Mirrors the notes feature; see its actions.ts.
const taskIdSchema = z.string().uuid();

function revalidateTasks() {
  revalidatePath("/tasks");
}

/**
 * List the current user's tasks. A "use server" bridge over
 * `queries.listTasks` so Client Components (e.g. a TanStack Query `queryFn`)
 * can call it — direct imports of `queries.ts` are blocked by its
 * `server-only` guard.
 */
export async function listTasksAction(): Promise<Task[]> {
  return listTasks();
}

/** Get one task by id. See {@link listTasksAction} for why this bridges `queries.ts`. */
export async function getTaskAction(id: string): Promise<Task | null> {
  if (!taskIdSchema.safeParse(id).success) return null;
  return getTask(id);
}

/** Create a task from just a title (the "quick add" flow). */
export async function createTask(
  input: CreateTaskInput,
): Promise<TaskResult<Task>> {
  const ctx = await requireUser("Tasks");
  if ("error" in ctx) return { error: ctx.error };

  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Please check the task and try again.",
    };
  }

  const { supabase, user } = ctx;
  const { data, error } = await supabase
    .from("tasks")
    .insert({ user_id: user.id, title: parsed.data.title })
    .select()
    .single();

  if (error || !data) return { error: "Failed to create task." };

  revalidateTasks();
  return { data };
}

/** Update a task's title, description, priority, due date, and/or completion. */
export async function updateTask(
  id: string,
  input: UpdateTaskInput,
): Promise<TaskResult<Task>> {
  if (!taskIdSchema.safeParse(id).success) return { error: NOT_FOUND };

  const ctx = await requireUser("Tasks");
  if ("error" in ctx) return { error: ctx.error };

  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Please check the task and try again.",
    };
  }

  const { title, description, priority, dueDate, isCompleted } = parsed.data;
  if (
    title === undefined &&
    description === undefined &&
    priority === undefined &&
    dueDate === undefined &&
    isCompleted === undefined
  ) {
    return { error: "Nothing to update." };
  }

  const { supabase, user } = ctx;
  const { data, error } = await supabase
    .from("tasks")
    .update({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(priority !== undefined && { priority }),
      ...(dueDate !== undefined && { due_date: dueDate }),
      // completed_at is server-derived, not client-supplied: stamped the
      // moment a task is marked done, cleared the moment it's reopened.
      ...(isCompleted !== undefined && {
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      }),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  // No matching row (wrong owner, or deleted between click and request) and a
  // genuine database error both land here — .single() errors either way, and
  // callers only need to know the update didn't happen.
  if (error || !data) return { error: "Failed to update task." };

  revalidateTasks();
  return { data };
}

/** Toggle a task's completion. Thin wrapper over {@link updateTask}. */
export async function toggleTaskComplete(
  id: string,
  isCompleted: boolean,
): Promise<TaskResult<Task>> {
  return updateTask(id, { isCompleted });
}

/** Delete a task. */
export async function deleteTask(
  id: string,
): Promise<TaskResult<{ id: string }>> {
  if (!taskIdSchema.safeParse(id).success) return { error: NOT_FOUND };

  const ctx = await requireUser("Tasks");
  if ("error" in ctx) return { error: ctx.error };

  const { supabase, user } = ctx;
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "Failed to delete task." };

  revalidateTasks();
  return { data: { id } };
}
