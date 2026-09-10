import type { GoalStatus } from "@/lib/supabase/types";

/**
 * Progress toward a goal as a whole percent, clamped to 0–100. Guards a
 * non-positive target (which the DB check constraint forbids, but a stale
 * client cache could still hold one transiently).
 */
export function getProgressPercent(current: number, target: number): number {
  if (!Number.isFinite(target) || target <= 0) return 0;
  const pct = Math.round((current / target) * 100);
  return Math.min(100, Math.max(0, pct));
}

/** Format a goal's numeric value for display: trims trailing zeros, caps at
 * two decimals ("24", "1500.5", "12.75"). */
export function formatGoalValue(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return String(Math.round(value * 100) / 100);
}

/** Sort rank so active goals come before achieved, then archived. */
export const STATUS_ORDER: Record<GoalStatus, number> = {
  active: 0,
  achieved: 1,
  archived: 2,
};

export const STATUS_LABEL: Record<GoalStatus, string> = {
  active: "Active",
  achieved: "Achieved",
  archived: "Archived",
};

/** Badge classes per status, from the design tokens (see the tasks feature's
 * priority.ts for the same approach). `active` renders no badge. */
export const STATUS_BADGE_CLASSNAME: Record<GoalStatus, string> = {
  active: "",
  achieved: "bg-chart-3/10 text-chart-3",
  archived: "bg-muted text-muted-foreground",
};
