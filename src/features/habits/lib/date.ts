/** Today's date as "YYYY-MM-DD" in the CALLER's local timezone. Always call
 * this on the client and pass the result explicitly — see the journal
 * feature's identical `todayIsoDate` for the timezone-mismatch bug this
 * avoids (computing "today" inside a Server Action would use the server
 * process's own timezone, not the user's). */
export function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** True if `isoDate` is well-formed AND a real calendar date — rejects
 * things like "2024-02-30" that pass a shape-only regex. Duplicated (in
 * miniature) from the journal feature's own `isRealCalendarDate` rather than
 * imported — features only share code through `src/lib`, never by reaching
 * into another feature's internals. */
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

/** True if `isoDate` is within one day (UTC) of right now — wide enough for
 * every real timezone's "today", narrow enough to reject an arbitrary
 * backdated/postdated log from a hand-crafted request. */
export function isWithinLoggableWindow(isoDate: string): boolean {
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

/** The last `count` dates as "YYYY-MM-DD", oldest first, ending today
 * (caller-local). Used to render the week-strip visualization. */
export function lastNDays(count: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
  }
  return dates;
}
