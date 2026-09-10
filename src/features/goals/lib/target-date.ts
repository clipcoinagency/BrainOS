import type { GoalStatus } from "@/lib/supabase/types";

export interface TargetDateStatus {
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

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/**
 * Describe a goal's target date for display: the formatted date, tinted with
 * the destructive token when it's in the past and the goal is still active.
 * Returns `null` when there is no target date.
 */
export function getTargetDateStatus(
  targetDate: string | null,
  status: GoalStatus,
): TargetDateStatus | null {
  if (!targetDate) return null;

  const label = `Target ${shortDateFormatter.format(parseLocalDate(targetDate))}`;

  if (status === "active") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parseLocalDate(targetDate).getTime() < today.getTime()) {
      return { label: `${label} · overdue`, className: "text-destructive" };
    }
  }

  return { label, className: "text-muted-foreground/70" };
}
