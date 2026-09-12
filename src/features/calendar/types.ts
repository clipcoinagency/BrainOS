export type CalendarEventType = "task" | "goal" | "project" | "journal";

export interface CalendarEvent {
  type: CalendarEventType;
  id: string;
  /** ISO date ("YYYY-MM-DD") this event falls on. */
  date: string;
  title: string;
  href: string;
}
