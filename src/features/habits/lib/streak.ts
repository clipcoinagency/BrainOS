import { todayIsoDate } from "./date";

/** Subtract `days` from an ISO date string, returning an ISO date string. */
function subtractDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day - days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * The current streak length: consecutive days, ending today OR yesterday,
 * with a completion logged. Ending on "yesterday" (not just "today") is
 * deliberate — a habit not yet done today shouldn't show its streak as
 * broken until the day is actually over; it breaks the FIRST time a day
 * passes with no log, not the moment "today" begins unlogged.
 *
 * `completedDates` need not be sorted or deduplicated.
 */
export function computeCurrentStreak(completedDates: string[]): number {
  const dates = new Set(completedDates);
  const today = todayIsoDate();

  let cursor = dates.has(today) ? today : subtractDays(today, 1);
  if (!dates.has(cursor)) return 0;

  let streak = 0;
  while (dates.has(cursor)) {
    streak += 1;
    cursor = subtractDays(cursor, 1);
  }
  return streak;
}
