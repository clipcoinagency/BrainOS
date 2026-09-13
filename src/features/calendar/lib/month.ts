import { monthParamSchema } from "../schemas";

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface MonthGridDay {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

/** A 6-week (42-day) grid for `month` (1-12) of `year`, starting on the
 * Sunday on/before the 1st and running past the end of the month so a
 * partial first/last week still shows its neighboring-month days (each
 * flagged via `isCurrentMonth`). `todayIso` is compared as a plain string,
 * not re-derived here, so callers control what "today" means (see the
 * calendar page for why a server-computed today is an accepted, low-stakes
 * approximation for this feature). */
export function getMonthGrid(
  year: number,
  month: number,
  todayIso: string,
): MonthGridDay[] {
  const firstOfMonth = new Date(year, month - 1, 1);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - firstOfMonth.getDay());

  const days: MonthGridDay[] = [];
  const cursor = new Date(gridStart);
  for (let i = 0; i < 42; i++) {
    const iso = toIsoDate(cursor);
    days.push({
      date: iso,
      day: cursor.getDate(),
      isCurrentMonth: cursor.getMonth() === month - 1,
      isToday: iso === todayIso,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/** The ISO date of the grid's first cell and the exclusive end (the day
 * after its last cell) — the range to fetch events for so leading/trailing
 * days from adjacent months show their events too. */
export function getMonthGridRange(
  year: number,
  month: number,
): { start: string; endExclusive: string } {
  const firstOfMonth = new Date(year, month - 1, 1);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - firstOfMonth.getDay());

  const gridEndExclusive = new Date(gridStart);
  gridEndExclusive.setDate(gridEndExclusive.getDate() + 42);

  return {
    start: toIsoDate(gridStart),
    endExclusive: toIsoDate(gridEndExclusive),
  };
}

/** Format an ISO date ("2026-09-17") as "Wednesday, September 17, 2026" —
 * used as the day cell's accessible name so a screen reader conveys weekday
 * context that the visual grid otherwise only shows via column position. */
export function formatFullDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function formatMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

/** Shift (year, month) by `delta` months (negative goes back). */
export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

/** Parse a "YYYY-MM" search-param value via `monthParamSchema`, falling back
 * when absent/invalid — Zod at the boundary, matching every other feature's
 * convention for external input (see the search feature's
 * `searchQuerySchema`), rather than a hand-rolled regex/range check that
 * could accept an out-of-range year. */
export function parseMonthParam(
  param: string | undefined,
  fallback: { year: number; month: number },
): { year: number; month: number } {
  if (!param) return fallback;
  const parsed = monthParamSchema.safeParse(param);
  return parsed.success ? parsed.data : fallback;
}

export function monthParam(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}
