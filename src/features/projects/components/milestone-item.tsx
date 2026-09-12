"use client";

import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Milestone } from "@/lib/supabase/types";

import {
  useDeleteMilestone,
  useToggleMilestoneComplete,
} from "../hooks/use-projects";

interface MilestoneItemProps {
  projectId: string;
  milestone: Milestone;
  /** Focused before this row's optimistic delete unmounts it — with no
   * confirmation dialog to hand focus off via `finalFocusRef`, this row's own
   * delete button would otherwise be removed while still focused, dropping
   * the browser to `<body>` (per the HTML spec for a removed focused
   * element). */
  finalFocusRef: React.RefObject<HTMLElement | null>;
}

export function MilestoneItem({
  projectId,
  milestone,
  finalFocusRef,
}: MilestoneItemProps) {
  const toggleComplete = useToggleMilestoneComplete(projectId, milestone.id);
  const deleteMilestone = useDeleteMilestone(projectId);

  function handleToggle() {
    toggleComplete.mutate(!milestone.is_completed, {
      onSuccess: (result) => {
        if ("error" in result) toast.error(result.error);
      },
      onError: () => toast.error("Failed to update milestone."),
    });
  }

  function handleDelete() {
    // No confirmation dialog: a milestone is a small, easily-retyped checklist
    // line, unlike the project itself — consistent with how deleting is a
    // lighter-weight action here than everywhere else a delete removes a
    // primary entity (notes, tasks, goals, projects all confirm). Move focus
    // BEFORE mutating: the optimistic update in useDeleteMilestone's onMutate
    // removes this row (and the button focus is currently on) as soon as
    // .mutate() runs, synchronously — focusing the fallback target first
    // means it's already the browser's focus by the time that happens.
    finalFocusRef.current?.focus();
    deleteMilestone.mutate(milestone.id, {
      onSuccess: (result) => {
        if ("error" in result) toast.error(result.error);
      },
      onError: () => toast.error("Failed to delete milestone."),
    });
  }

  return (
    <div className="group flex items-center gap-3 rounded-lg border p-2.5">
      <Checkbox
        checked={milestone.is_completed}
        onCheckedChange={handleToggle}
        aria-label={
          milestone.is_completed
            ? `Mark "${milestone.title}" incomplete`
            : `Mark "${milestone.title}" complete`
        }
      />
      <p
        className={cn(
          "min-w-0 flex-1 truncate text-sm",
          milestone.is_completed && "text-muted-foreground line-through",
        )}
      >
        {milestone.title}
      </p>
      {/* Not disabled while pending — see goal-card.tsx's steppers for why
          disabling a focused button force-blurs it. */}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete "${milestone.title}"`}
        onClick={handleDelete}
        className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
