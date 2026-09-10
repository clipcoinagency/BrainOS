"use client";

import { Fragment, useMemo, useState } from "react";
import { Loader2, Plus, Search, Target } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Goal } from "@/lib/supabase/types";

import { useCreateGoal, useGoalsQuery } from "../hooks/use-goals";
import { STATUS_LABEL, STATUS_ORDER } from "../lib/progress";
import { DeleteGoalDialog } from "./delete-goal-dialog";
import { GoalCard } from "./goal-card";
import { GoalEditDialog } from "./goal-edit-dialog";

function compareGoals(a: Goal, b: Goal): number {
  if (a.status !== b.status) {
    return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  }

  if (a.status === "active") {
    // Soonest target date first (no date sorts last), then newest created.
    const aDue = a.target_date ? new Date(a.target_date).getTime() : Infinity;
    const bDue = b.target_date ? new Date(b.target_date).getTime() : Infinity;
    if (aDue !== bDue) return aDue - bDue;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }

  // Achieved / archived: most recently touched first.
  return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
}

export function GoalsView({ initialGoals }: { initialGoals: Goal[] }) {
  const [query, setQuery] = useState("");
  const [quickAdd, setQuickAdd] = useState("");
  const { data: goals } = useGoalsQuery(initialGoals);
  const createGoal = useCreateGoal();

  // Lifted here (not inside GoalCard) — an optimistic delete removes the goal
  // (and its card) the instant it's confirmed, so a dialog owned by the card
  // can't outlive its own confirmation. Same reasoning as notes/tasks.
  const [editTarget, setEditTarget] = useState<Goal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Goal | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return goals;
    return goals.filter(
      (goal) =>
        goal.title.toLowerCase().includes(q) ||
        goal.description.toLowerCase().includes(q),
    );
  }, [goals, query]);

  // One sorted array under one parent grid — not separate arrays per status
  // group under separate containers — so React matches cards by key across a
  // status change instead of unmounting/remounting the card the user just
  // acted on. See the Notes feature for the bug this avoids.
  const sorted = useMemo(() => [...filtered].sort(compareGoals), [filtered]);
  const firstAchievedIndex = sorted.findIndex((g) => g.status === "achieved");
  const firstArchivedIndex = sorted.findIndex((g) => g.status === "archived");

  function handleQuickAdd(event: React.FormEvent) {
    event.preventDefault();
    const title = quickAdd.trim();
    if (!title) return;

    createGoal.mutate(
      { title },
      {
        onSuccess: (result) => {
          if ("error" in result) {
            toast.error(result.error);
            return;
          }
          setQuickAdd("");
        },
        onError: () => toast.error("Failed to create goal."),
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goals"
        description="Set outcomes and measure progress over time."
      />

      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <Input
          value={quickAdd}
          onChange={(event) => setQuickAdd(event.target.value)}
          placeholder="Name a goal and press Enter…"
          aria-label="New goal title"
        />
        <Button
          type="submit"
          disabled={createGoal.isPending || !quickAdd.trim()}
        >
          {createGoal.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Add
        </Button>
      </form>

      {goals.length > 0 ? (
        <div className="relative max-w-sm">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search goals…"
            className="pl-8"
            aria-label="Search goals"
          />
        </div>
      ) : null}

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Name your first goal above, then set its target and track progress."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching goals"
          description={`Nothing matches "${query}". Try a different search.`}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((goal, index) => (
            <Fragment key={goal.id}>
              {index === firstAchievedIndex && firstAchievedIndex > 0 ? (
                <h2 className="text-muted-foreground col-span-full text-xs font-medium tracking-wider uppercase">
                  {STATUS_LABEL.achieved}
                </h2>
              ) : null}
              {index === firstArchivedIndex && firstArchivedIndex > 0 ? (
                <h2 className="text-muted-foreground col-span-full text-xs font-medium tracking-wider uppercase">
                  {STATUS_LABEL.archived}
                </h2>
              ) : null}
              <GoalCard
                goal={goal}
                onEdit={setEditTarget}
                onRequestDelete={setDeleteTarget}
              />
            </Fragment>
          ))}
        </div>
      )}

      <GoalEditDialog
        goal={editTarget}
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      />

      <DeleteGoalDialog
        goalId={deleteTarget?.id ?? ""}
        goalTitle={deleteTarget?.title.trim() ?? ""}
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
