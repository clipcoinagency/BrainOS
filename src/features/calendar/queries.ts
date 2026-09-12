import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

import type { CalendarEvent } from "./types";

/**
 * Aggregate every date-bearing item across modules into a unified calendar
 * feed: open tasks by due date, active goals/projects by target date, and
 * journal entries by their day. Queries each module's table directly
 * (scoped to the caller) rather than importing those features' internals —
 * same approach the search feature uses for the same reason (a shell/
 * cross-cutting feature isn't "inside" any one of the features it reads).
 *
 * Returns an empty array (never throws) when Supabase is not configured or
 * the user is unauthenticated. Not wrapped in React's `cache()`: unlike a
 * single-entity `getX(id)`, the range varies with the visible month, so
 * there's nothing to usefully dedupe within one request.
 */
export async function listCalendarEvents(
  startIso: string,
  endIsoExclusive: string,
): Promise<CalendarEvent[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const [tasks, goals, projects, journalEntries] = await Promise.all([
      supabase
        .from("tasks")
        .select("id, title, due_date")
        .eq("user_id", user.id)
        .eq("is_completed", false)
        .gte("due_date", startIso)
        .lt("due_date", endIsoExclusive),
      supabase
        .from("goals")
        .select("id, title, target_date")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gte("target_date", startIso)
        .lt("target_date", endIsoExclusive),
      supabase
        .from("projects")
        .select("id, title, target_date")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gte("target_date", startIso)
        .lt("target_date", endIsoExclusive),
      supabase
        .from("journal_entries")
        .select("id, entry_date")
        .eq("user_id", user.id)
        .gte("entry_date", startIso)
        .lt("entry_date", endIsoExclusive),
    ]);

    const events: CalendarEvent[] = [];

    for (const row of tasks.data ?? []) {
      if (!row.due_date) continue;
      events.push({
        type: "task",
        id: row.id,
        date: row.due_date,
        title: row.title,
        href: "/tasks",
      });
    }
    for (const row of goals.data ?? []) {
      if (!row.target_date) continue;
      events.push({
        type: "goal",
        id: row.id,
        date: row.target_date,
        title: row.title,
        href: "/goals",
      });
    }
    for (const row of projects.data ?? []) {
      if (!row.target_date) continue;
      events.push({
        type: "project",
        id: row.id,
        date: row.target_date,
        title: row.title.trim() || "Untitled",
        href: `/projects/${row.id}`,
      });
    }
    for (const row of journalEntries.data ?? []) {
      events.push({
        type: "journal",
        id: row.id,
        date: row.entry_date,
        title: "Journal entry",
        href: `/journal/${row.id}`,
      });
    }

    return events;
  } catch {
    return [];
  }
}
