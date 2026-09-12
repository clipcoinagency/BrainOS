/** Today's date as `YYYY-MM-DD` in the CALLER's local timezone. Always call
 * this on the client and pass the result explicitly as `entryDate` — calling
 * it inside a Server Action would compute "today" in the server process's
 * timezone instead of the user's, which can silently disagree with the
 * user's own calendar day for hours around midnight. */
export function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** True if `isoDate` is well-formed AND a real calendar date — rejects
 * things like "2024-02-30" or "2026-13-01" that pass a shape-only regex,
 * since `Date`'s constructor silently normalizes overflow instead of
 * rejecting it (this round-trips the parsed value back through UTC field
 * getters and compares). */
export function isRealCalendarDate(isoDate: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** True if `isoDate` is within one day (UTC) of right now. A client
 * legitimately sends its own local "today" as `entryDate`, which — because
 * timezones only shift the calendar date, never the instant — can differ
 * from the server's UTC date by at most one day in either direction, never
 * more. Bounding to that window lets a real client timezone through while
 * rejecting arbitrary backdating/postdating from a hand-crafted request. */
export function isWithinCreatableWindow(isoDate: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return false;

  const target = Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  const now = new Date();
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const oneDayMs = 24 * 60 * 60 * 1000;

  return Math.abs(target - todayUtc) <= oneDayMs;
}

/** Format an entry date ("2026-09-12") as "Saturday, September 12, 2026".
 * Parsed as a local calendar date (not UTC midnight) so the day never shifts
 * by one in timezones behind UTC. */
export function formatEntryDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;

  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/** Short form ("Sep 12, 2026") for cards and lists. */
export function formatEntryDateShort(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;

  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
