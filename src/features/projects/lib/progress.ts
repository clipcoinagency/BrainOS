import type { ProjectStatus } from "@/lib/supabase/types";

/**
 * Progress toward a project as a whole percent, clamped to 0–100, derived
 * from its milestone completion count. Returns `null` when there are no
 * milestones yet — a project with nothing checked off isn't "0% done" so
 * much as "not started tracking yet"; callers should render no progress bar
 * rather than a misleadingly empty one.
 */
export function getProgressPercent(
  completed: number,
  total: number,
): number | null {
  if (!Number.isFinite(completed) || !Number.isFinite(total) || total <= 0) {
    return null;
  }
  const pct = Math.round((completed / total) * 100);
  return Math.min(100, Math.max(0, pct));
}

/** Sort rank so active projects come before completed, then archived. */
export const STATUS_ORDER: Record<ProjectStatus, number> = {
  active: 0,
  completed: 1,
  archived: 2,
};

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  active: "Active",
  completed: "Completed",
  archived: "Archived",
};

/** Badge classes per status, from the design tokens — mirrors the goals
 * feature's approach. `active` renders no badge. */
export const STATUS_BADGE_CLASSNAME: Record<ProjectStatus, string> = {
  active: "",
  completed: "bg-chart-3/10 text-chart-3",
  archived: "bg-muted text-muted-foreground",
};
