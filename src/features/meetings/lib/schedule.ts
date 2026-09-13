/** Format an ISO instant for the `<input type="datetime-local">` control,
 * which requires a naive "YYYY-MM-DDTHH:mm" string in the BROWSER's local
 * time — not the ISO string's own UTC/offset representation. Returns "" for
 * `null` (no time set), which the input treats as empty. */
export function toDatetimeLocalValue(isoString: string | null): string {
  if (!isoString) return "";

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/** Convert a `<input type="datetime-local">` value (naive, browser-local
 * time, no timezone) into a real ISO 8601 instant — `new Date(value)`
 * parses that naive string AS the browser's own local time, so
 * `.toISOString()` produces the correct UTC instant regardless of the
 * user's timezone. Returns `null` for an empty value (clearing the time). */
export function fromDatetimeLocalValue(value: string): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

/** Format an ISO instant for display ("Sep 13, 2026, 2:30 PM") in the
 * viewer's local time. */
export function formatMeetingDateTime(isoString: string | null): string {
  if (!isoString) return "No time set";

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "No time set";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
