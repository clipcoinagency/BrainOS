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

/** Parse a "YYYY-MM" search-param value, falling back when absent/invalid —
 * this is a URL param, reachable with arbitrary text regardless of what the
 * UI itself ever sends. */
export function parseMonthParam(
  param: string | undefined,
  fallback: { year: number; month: number },
): { year: number; month: number } {
  const match = param ? /^(\d{4})-(\d{2})$/.exec(param) : null;
  if (!match) return fallback;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return fallback;

  return { year, month };
}

export function monthParam(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}
