"use client";

import { MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/supabase/types";

import { useToggleTaskComplete } from "../hooks/use-tasks";
import { getDueDateStatus } from "../lib/due-date";
import { PRIORITY_BADGE_CLASSNAME, PRIORITY_LABEL } from "../lib/priority";

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onRequestDelete: (task: Task) => void;
}

export function TaskItem({ task, onEdit, onRequestDelete }: TaskItemProps) {
  const toggleComplete = useToggleTaskComplete(task.id);

  const dueStatus = getDueDateStatus(task.due_date, task.is_completed);
  const showPriorityBadge = !task.is_completed && task.priority !== "none";

  function handleToggle() {
    toggleComplete.mutate(!task.is_completed, {
      onSuccess: (result) => {
        if ("error" in result) toast.error(result.error);
      },
      onError: () => toast.error("Failed to update task."),
    });
  }

  return (
    <div className="group hover:border-brand/40 flex items-center gap-3 rounded-lg border p-3 transition-colors">
      <Checkbox
        checked={task.is_completed}
        onCheckedChange={handleToggle}
        aria-label={
          task.is_completed ? "Mark task incomplete" : "Mark task complete"
        }
      />

      <button
        type="button"
        onClick={() => onEdit(task)}
        aria-label={`Edit "${task.title || "Untitled task"}"`}
        className="focus-visible:ring-ring min-w-0 flex-1 rounded text-left focus-visible:ring-2 focus-visible:outline-none"
      >
        <p
          className={cn(
            "truncate text-sm",
            task.is_completed && "text-muted-foreground line-through",
          )}
          aria-hidden
        >
          {task.title}
        </p>
        {showPriorityBadge || dueStatus ? (
          <div className="mt-1 flex flex-wrap items-center gap-1.5" aria-hidden>
            {showPriorityBadge ? (
              <Badge
                variant="outline"
                className={cn(
                  "border-transparent",
                  PRIORITY_BADGE_CLASSNAME[task.priority],
                )}
              >
                {PRIORITY_LABEL[task.priority]}
              </Badge>
            ) : null}
            {dueStatus ? (
              <Badge
                variant="outline"
                className={cn("border-transparent", dueStatus.className)}
              >
                {dueStatus.label}
              </Badge>
            ) : null}
          </div>
        ) : null}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Task actions"
            className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 has-data-[state=open]:opacity-100"
          >
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => onRequestDelete(task)}
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
