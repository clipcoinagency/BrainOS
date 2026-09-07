export interface DueDateStatus {
  label: string;
  className: string;
}

/**
 * Parse a "YYYY-MM-DD" date-only string as a LOCAL date. `new Date(isoDate)`
 * parses date-only strings as UTC midnight, which shifts the displayed day
 * back by one in any timezone behind UTC — this avoids that pitfall.
 */
function parseLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

const MS_PER_DAY = 86_400_000;

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

/**
 * Describe a task's due date for display: label + a color class built from
 * the design tokens (destructive for overdue, the `chart-4` amber for due
 * today, muted for everything else). Returns `null` for a completed task or
 * one with no due date — neither needs a due-date badge.
 */
export function getDueDateStatus(
  dueDate: string | null,
  isCompleted: boolean,
): DueDateStatus | null {
  if (!dueDate || isCompleted) return null;

  const due = parseLocalDate(dueDate);
  const today = startOfToday();
  const diffDays = Math.round((due.getTime() - today.getTime()) / MS_PER_DAY);

  if (diffDays < 0) {
    return {
      label: "Overdue",
      className: "bg-destructive/10 text-destructive",
    };
  }
  if (diffDays === 0) {
    return { label: "Today", className: "bg-chart-4/10 text-chart-4" };
  }
  if (diffDays === 1) {
    return { label: "Tomorrow", className: "bg-muted text-muted-foreground" };
  }
  return {
    label: shortDateFormatter.format(due),
    className: "bg-muted text-muted-foreground",
  };
}
