/** Today's date as `YYYY-MM-DD` in the server's local timezone, matching the
 * Postgres `date` column's default (`current_date`). Used so a freshly
 * created entry's optimistic client state and the row the server actually
 * inserts agree on "today" without a round trip. */
export function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
