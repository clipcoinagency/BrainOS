"use client";

import { useMemo } from "react";
import { Flame, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { useToggleHabitLog } from "../hooks/use-habits";
import { lastNDays, todayIsoDate } from "../lib/date";
import type { HabitWithLogs } from "../queries";
import { computeCurrentStreak } from "../lib/streak";

const WEEK_STRIP_DAYS = 7;

interface HabitCardProps {
  habit: HabitWithLogs;
  onEdit: (habit: HabitWithLogs) => void;
  onRequestDelete: (habit: HabitWithLogs) => void;
}

export function HabitCard({ habit, onEdit, onRequestDelete }: HabitCardProps) {
  const toggleLog = useToggleHabitLog(habit.id);

  const today = todayIsoDate();
  const completedDates = useMemo(
    () => new Set(habit.recentDates),
    [habit.recentDates],
  );
  const doneToday = completedDates.has(today);
  const streak = useMemo(
    () => computeCurrentStreak(habit.recentDates),
    [habit.recentDates],
  );
  const week = useMemo(() => lastNDays(WEEK_STRIP_DAYS), []);

  function handleToggle() {
    toggleLog.mutate(
      { date: today, completed: !doneToday },
      {
        onSuccess: (result) => {
          if ("error" in result) toast.error(result.error);
        },
        onError: () => toast.error("Failed to update habit."),
      },
    );
  }

  return (
    <div className="group hover:border-brand/40 flex items-center gap-3 rounded-lg border p-3 transition-colors">
      <Checkbox
        checked={doneToday}
        onCheckedChange={handleToggle}
        aria-label={
          doneToday
            ? `Mark "${habit.title}" not done today`
            : `Mark "${habit.title}" done today`
        }
        className="size-5"
      />

      <button
        type="button"
        onClick={() => onEdit(habit)}
        aria-label={`Edit "${habit.title}", ${streak}-day streak`}
        className="focus-visible:ring-ring min-w-0 flex-1 rounded text-left focus-visible:ring-2 focus-visible:outline-none"
      >
        <p className="truncate text-sm font-medium" aria-hidden>
          {habit.title}
        </p>
        <div className="mt-1.5 flex items-center gap-2.5" aria-hidden>
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium tabular-nums",
              streak > 0 ? "text-chart-4" : "text-muted-foreground/60",
            )}
          >
            <Flame className="size-3.5" />
            {streak}
          </span>
          <div className="flex items-center gap-1">
            {week.map((date) => (
              <span
                key={date}
                className={cn(
                  "size-2 rounded-full",
                  completedDates.has(date) ? "bg-brand" : "bg-muted",
                )}
              />
            ))}
          </div>
        </div>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Habit actions"
            className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 has-data-[state=open]:opacity-100"
          >
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => onRequestDelete(habit)}
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
