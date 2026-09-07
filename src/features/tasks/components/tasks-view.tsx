"use client";

import { Fragment, useMemo, useState } from "react";
import { Loader2, ListChecks, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Task } from "@/lib/supabase/types";

import { useCreateTask, useTasksQuery } from "../hooks/use-tasks";
import { PRIORITY_ORDER } from "../lib/priority";
import { DeleteTaskDialog } from "./delete-task-dialog";
import { TaskEditDialog } from "./task-edit-dialog";
import { TaskItem } from "./task-item";

function compareTasks(a: Task, b: Task): number {
  if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;

  if (!a.is_completed) {
    // Open tasks: soonest due date first (no date sorts last), then
    // priority (high first), then newest created as the final tiebreak.
    const aDue = a.due_date ? new Date(a.due_date).getTime() : Infinity;
    const bDue = b.due_date ? new Date(b.due_date).getTime() : Infinity;
    if (aDue !== bDue) return aDue - bDue;

    const priorityDiff =
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }

  // Completed tasks: most recently completed first.
  const aCompleted = a.completed_at ? new Date(a.completed_at).getTime() : 0;
  const bCompleted = b.completed_at ? new Date(b.completed_at).getTime() : 0;
  return bCompleted - aCompleted;
}

export function TasksView({ initialTasks }: { initialTasks: Task[] }) {
  const [query, setQuery] = useState("");
  const [quickAdd, setQuickAdd] = useState("");
  const { data: tasks } = useTasksQuery(initialTasks);
  const createTask = useCreateTask();

  // Lifted here (not inside TaskItem) for the same reason as Notes' delete
  // dialog: an optimistic delete removes the task — and its TaskItem — from
  // this list the instant it's confirmed, so a dialog owned by the item
  // can't outlive its own confirmation.
  const [editTarget, setEditTarget] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(q) ||
        task.description.toLowerCase().includes(q),
    );
  }, [tasks, query]);

  // One sorted array under one parent — not separate "open"/"completed"
  // arrays under separate containers — so React can match a task by key
  // across a completion toggle instead of unmounting/remounting its row.
  // See the Notes feature's notes-view.tsx for the bug this pattern avoids.
  const sorted = useMemo(() => [...filtered].sort(compareTasks), [filtered]);

  const firstCompletedIndex = sorted.findIndex((task) => task.is_completed);
  const hasBothSections =
    firstCompletedIndex > 0 && firstCompletedIndex < sorted.length;

  function handleQuickAdd(event: React.FormEvent) {
    event.preventDefault();
    const title = quickAdd.trim();
    if (!title) return;

    createTask.mutate(
      { title },
      {
        onSuccess: (result) => {
          if ("error" in result) {
            toast.error(result.error);
            return;
          }
          setQuickAdd("");
        },
        onError: () => toast.error("Failed to create task."),
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Track to-dos with priorities and due dates."
      />

      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <Input
          value={quickAdd}
          onChange={(event) => setQuickAdd(event.target.value)}
          placeholder="Add a task and press Enter…"
          aria-label="New task title"
          // Not disabled while pending: disabling a *focused* native input
          // force-blurs it (deterministic browser behavior), which would
          // kick focus out of the field after every single quick-add and
          // break typing several tasks in a row. The submit button below
          // already shows pending state.
        />
        <Button
          type="submit"
          disabled={createTask.isPending || !quickAdd.trim()}
        >
          {createTask.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Add
        </Button>
      </form>

      {tasks.length > 0 ? (
        <div className="relative max-w-sm">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tasks…"
            className="pl-8"
            aria-label="Search tasks"
          />
        </div>
      ) : null}

      {tasks.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No tasks yet"
          description="Add your first task above to start tracking your to-dos."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching tasks"
          description={`Nothing matches "${query}". Try a different search.`}
        />
      ) : (
        <div className="space-y-2">
          {sorted.map((task, index) => (
            <Fragment key={task.id}>
              {hasBothSections && index === firstCompletedIndex ? (
                <h2 className="text-muted-foreground pt-2 text-xs font-medium tracking-wider uppercase">
                  Completed
                </h2>
              ) : null}
              <TaskItem
                task={task}
                onEdit={setEditTarget}
                onRequestDelete={setDeleteTarget}
              />
            </Fragment>
          ))}
        </div>
      )}

      <TaskEditDialog
        task={editTarget}
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      />

      <DeleteTaskDialog
        taskId={deleteTarget?.id ?? ""}
        taskTitle={deleteTarget?.title.trim() ?? ""}
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
