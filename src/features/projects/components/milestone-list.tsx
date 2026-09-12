"use client";

import { useMemo, useState } from "react";
import { ListChecks, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import type { Milestone } from "@/lib/supabase/types";

import { useCreateMilestone, useMilestonesQuery } from "../hooks/use-projects";
import { getProgressPercent } from "../lib/progress";
import { MilestoneItem } from "./milestone-item";

function compareMilestones(a: Milestone, b: Milestone): number {
  if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;

  if (!a.is_completed) {
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  }

  return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
}

export function MilestoneList({
  projectId,
  initialMilestones,
}: {
  projectId: string;
  initialMilestones: Milestone[];
}) {
  const [quickAdd, setQuickAdd] = useState("");
  const { data: milestones } = useMilestonesQuery(projectId, initialMilestones);
  const createMilestone = useCreateMilestone(projectId);

  const sorted = useMemo(
    () => [...milestones].sort(compareMilestones),
    [milestones],
  );
  const completed = milestones.filter((m) => m.is_completed).length;
  const percent = getProgressPercent(completed, milestones.length);

  function handleQuickAdd(event: React.FormEvent) {
    event.preventDefault();
    const title = quickAdd.trim();
    if (!title) return;

    createMilestone.mutate(
      { title },
      {
        onSuccess: (result) => {
          if ("error" in result) {
            toast.error(result.error);
            return;
          }
          setQuickAdd("");
        },
        onError: () => toast.error("Failed to create milestone."),
      },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Milestones</h2>
        {percent !== null ? (
          <span className="text-muted-foreground text-xs tabular-nums">
            {completed} / {milestones.length} · {percent}%
          </span>
        ) : null}
      </div>

      {percent !== null ? (
        <Progress value={percent} aria-label="Milestones progress" />
      ) : null}

      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <Input
          value={quickAdd}
          onChange={(event) => setQuickAdd(event.target.value)}
          placeholder="Add a milestone and press Enter…"
          aria-label="New milestone title"
        />
        <Button
          type="submit"
          disabled={createMilestone.isPending || !quickAdd.trim()}
        >
          {createMilestone.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Add
        </Button>
      </form>

      {milestones.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No milestones yet"
          description="Break this project into milestones to track its progress."
        />
      ) : (
        <div className="space-y-2">
          {sorted.map((milestone) => (
            <MilestoneItem
              key={milestone.id}
              projectId={projectId}
              milestone={milestone}
            />
          ))}
        </div>
      )}
    </div>
  );
}
