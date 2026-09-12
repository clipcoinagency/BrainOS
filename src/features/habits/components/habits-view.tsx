"use client";

import { useMemo, useState } from "react";
import { Activity, Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useCreateHabit, useHabitsQuery } from "../hooks/use-habits";
import type { HabitWithLogs } from "../queries";
import { DeleteHabitDialog } from "./delete-habit-dialog";
import { HabitCard } from "./habit-card";
import { HabitEditDialog } from "./habit-edit-dialog";

export function HabitsView({
  initialHabits,
}: {
  initialHabits: HabitWithLogs[];
}) {
  const [query, setQuery] = useState("");
  const [quickAdd, setQuickAdd] = useState("");
  const { data: habits } = useHabitsQuery(initialHabits);
  const createHabit = useCreateHabit();

  // Lifted here (not inside HabitCard) for the same reason as tasks/goals:
  // an optimistic delete removes the habit — and its card — from this list
  // the instant it's confirmed, so a dialog owned by the card can't outlive
  // its own confirmation.
  const [editTarget, setEditTarget] = useState<HabitWithLogs | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HabitWithLogs | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return habits;
    return habits.filter(
      (habit) =>
        habit.title.toLowerCase().includes(q) ||
        habit.description.toLowerCase().includes(q),
    );
  }, [habits, query]);

  function handleQuickAdd(event: React.FormEvent) {
    event.preventDefault();
    const title = quickAdd.trim();
    if (!title) return;

    createHabit.mutate(
      { title },
      {
        onSuccess: (result) => {
          if ("error" in result) {
            toast.error(result.error);
            return;
          }
          setQuickAdd("");
        },
        onError: () => toast.error("Failed to create habit."),
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Habits"
        description="Build streaks and track daily routines."
      />

      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <Input
          value={quickAdd}
          onChange={(event) => setQuickAdd(event.target.value)}
          placeholder="Add a habit and press Enter…"
          aria-label="New habit title"
        />
        <Button
          type="submit"
          disabled={createHabit.isPending || !quickAdd.trim()}
        >
          {createHabit.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Add
        </Button>
      </form>

      {habits.length > 0 ? (
        <div className="relative max-w-sm">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search habits…"
            className="pl-8"
            aria-label="Search habits"
          />
        </div>
      ) : null}

      {habits.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No habits yet"
          description="Add your first habit above to start building a streak."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching habits"
          description={`Nothing matches "${query}". Try a different search.`}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onEdit={setEditTarget}
              onRequestDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <HabitEditDialog
        habit={editTarget}
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      />

      <DeleteHabitDialog
        habitId={deleteTarget?.id ?? ""}
        habitTitle={deleteTarget?.title.trim() ?? ""}
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
