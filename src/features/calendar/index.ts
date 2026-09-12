/**
 * Public surface of the calendar feature.
 *
 * Client-safe: the `CalendarView` component. Everything here is read-only —
 * see `./queries` (server-only) for the aggregation logic, and `./lib/month`
 * for the pure month-grid math.
 */
export { CalendarView } from "./components/calendar-view";
export type { CalendarEvent, CalendarEventType } from "./types";
