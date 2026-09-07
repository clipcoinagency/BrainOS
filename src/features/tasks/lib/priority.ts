import type { TaskPriority } from "../schemas";

/** Lower sorts first — high priority floats to the top of the open list. */
export const PRIORITY_ORDER: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
  none: 3,
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "No priority",
};

/** Badge classes per priority, built from the existing `--chart-*` tokens
 * rather than off-palette colors. `none` renders no badge (see callers). */
export const PRIORITY_BADGE_CLASSNAME: Record<TaskPriority, string> = {
  high: "bg-chart-5/10 text-chart-5",
  medium: "bg-chart-4/10 text-chart-4",
  low: "bg-chart-2/10 text-chart-2",
  none: "",
};
