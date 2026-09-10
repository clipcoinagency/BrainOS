"use client";

import { Minus, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Goal, GoalStatus } from "@/lib/supabase/types";

import { useUpdateGoal, useUpdateGoalProgress } from "../hooks/use-goals";
import {
  formatGoalValue,
  getProgressPercent,
  STATUS_BADGE_CLASSNAME,
  STATUS_LABEL,
} from "../lib/progress";
import { getTargetDateStatus } from "../lib/target-date";

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onRequestDelete: (goal: Goal) => void;
}

/** Round to 4 dp so repeated float steps don't accrue artifacts. */
function step(value: number, delta: number): number {
  return Math.max(0, Math.round((value + delta) * 10000) / 10000);
}

export function GoalCard({ goal, onEdit, onRequestDelete }: GoalCardProps) {
  const updateGoal = useUpdateGoal(goal.id);
  const updateProgress = useUpdateGoalProgress(goal.id);

  const title = goal.title.trim() || "Untitled goal";
  const percent = getProgressPercent(goal.current_value, goal.target_value);
  const showStatusBadge = goal.status !== "active";
  const targetDate = getTargetDateStatus(goal.target_date, goal.status);

  function setProgress(next: number) {
    updateProgress.mutate(next, {
      onSuccess: (result) => {
        if ("error" in result) toast.error(result.error);
      },
      onError: () => toast.error("Failed to update progress."),
    });
  }

  function setStatus(status: GoalStatus) {
    updateGoal.mutate(
      { status },
      {
        onSuccess: (result) => {
          if ("error" in result) toast.error(result.error);
        },
        onError: () => toast.error("Failed to update goal."),
      },
    );
  }

  return (
    <div className="group bg-card hover:border-brand/40 flex flex-col gap-3 rounded-xl border p-4 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => onEdit(goal)}
          aria-label={`Edit "${title}"`}
          className="focus-visible:ring-ring min-w-0 flex-1 rounded text-left focus-visible:ring-2 focus-visible:outline-none"
        >
          <h3
            className={cn(
              "truncate text-sm font-medium",
              goal.status === "archived" && "text-muted-foreground",
            )}
          >
            {title}
          </h3>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          {showStatusBadge ? (
            <Badge
              variant="outline"
              className={cn(
                "border-transparent",
                STATUS_BADGE_CLASSNAME[goal.status],
              )}
            >
              {STATUS_LABEL[goal.status]}
            </Badge>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Goal actions"
                className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 has-data-[state=open]:opacity-100"
              >
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEdit(goal)}>
                Edit
              </DropdownMenuItem>
              {goal.status !== "achieved" ? (
                <DropdownMenuItem onSelect={() => setStatus("achieved")}>
                  Mark achieved
                </DropdownMenuItem>
              ) : null}
              {goal.status !== "active" ? (
                <DropdownMenuItem onSelect={() => setStatus("active")}>
                  Reactivate
                </DropdownMenuItem>
              ) : null}
              {goal.status !== "archived" ? (
                <DropdownMenuItem onSelect={() => setStatus("archived")}>
                  Archive
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => onRequestDelete(goal)}
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Progress value={percent} aria-label={`${title} progress`} />

      {/* Not disabled while the mutation is pending: disabling a *focused*
          button force-blurs it (deterministic browser behavior), dropping a
          keyboard user to the top of the page after every step. The shared
          mutation `scope` already serializes rapid clicks and `onMutate`
          advances the bar optimistically, so an `isPending` guard buys no
          ordering safety — see the same lesson for the tasks quick-add. */}
      <div
        className="text-muted-foreground flex items-center gap-2 text-xs"
        aria-busy={updateProgress.isPending}
      >
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Decrease progress for "${title}"`}
          disabled={goal.current_value <= 0}
          onClick={() => setProgress(step(goal.current_value, -1))}
        >
          <Minus className="size-3" />
        </Button>
        <span className="tabular-nums" aria-live="polite">
          {formatGoalValue(goal.current_value)} /{" "}
          {formatGoalValue(goal.target_value)}
          {goal.unit ? ` ${goal.unit}` : ""} · {percent}%
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Increase progress for "${title}"`}
          onClick={() => setProgress(step(goal.current_value, 1))}
        >
          <Plus className="size-3" />
        </Button>
      </div>

      {targetDate ? (
        <p className={cn("text-[11px]", targetDate.className)}>
          {targetDate.label}
        </p>
      ) : null}
    </div>
  );
}
