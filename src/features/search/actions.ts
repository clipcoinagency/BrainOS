"use server";

import { requireUser } from "@/lib/supabase/require-user";

import { searchQuerySchema } from "./schemas";
import type { SearchResult } from "./types";

const RESULTS_PER_TYPE = 5;

/** Escape ILIKE's own wildcard characters (`%`, `_`) in user input so a
 * query like "50% off" is matched literally instead of `%` being treated as
 * a pattern wildcard. Postgres's default ILIKE escape character is `\`. */
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

/** Format a journal entry's "YYYY-MM-DD" as "Sep 12, 2026" for the result
 * list. Duplicated (in miniature) from the journal feature's own
 * `formatEntryDateShort` rather than imported — features only share code
 * through `src/lib`/`src/components`/`src/hooks`, never by reaching into
 * another feature's internals. */
function formatJournalDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

/**
 * Search across every module's titles (journal entries, which have no
 * title, are matched on content instead) and return a small, unified result
 * list for the command palette.
 *
 * Scope note: task and goal results link to their list page, not a specific
 * item — unlike notes/projects/journal, tasks and goals have no per-item
 * route (they're edited via a dialog on their list page), so there's
 * nothing more specific to deep-link to yet.
 */
export async function searchWorkspace(query: string): Promise<SearchResult[]> {
  const parsed = searchQuerySchema.safeParse(query);
  if (!parsed.success) return [];

  const ctx = await requireUser("Search");
  if ("error" in ctx) return [];

  const { supabase, user } = ctx;
  const pattern = `%${escapeLikePattern(parsed.data)}%`;

  const [notes, tasks, goals, projects, journalEntries] = await Promise.all([
    supabase
      .from("notes")
      .select("id, title")
      .eq("user_id", user.id)
      .ilike("title", pattern)
      .limit(RESULTS_PER_TYPE),
    supabase
      .from("tasks")
      .select("id, title")
      .eq("user_id", user.id)
      .ilike("title", pattern)
      .limit(RESULTS_PER_TYPE),
    supabase
      .from("goals")
      .select("id, title")
      .eq("user_id", user.id)
      .ilike("title", pattern)
      .limit(RESULTS_PER_TYPE),
    supabase
      .from("projects")
      .select("id, title")
      .eq("user_id", user.id)
      .ilike("title", pattern)
      .limit(RESULTS_PER_TYPE),
    supabase
      .from("journal_entries")
      .select("id, entry_date, content")
      .eq("user_id", user.id)
      .ilike("content", pattern)
      .limit(RESULTS_PER_TYPE),
  ]);

  // A per-table failure (RLS misconfiguration, transient DB error) would
  // otherwise silently degrade to "no matches" for that category, making a
  // real backend failure indistinguishable from an honest empty result —
  // log it so it's at least observable server-side, without failing the
  // whole search over one category.
  for (const [label, result] of [
    ["notes", notes],
    ["tasks", tasks],
    ["goals", goals],
    ["projects", projects],
    ["journal_entries", journalEntries],
  ] as const) {
    if (result.error) {
      console.error(`searchWorkspace: ${label} query failed`, result.error);
    }
  }

  const results: SearchResult[] = [];

  for (const row of notes.data ?? []) {
    results.push({
      type: "note",
      id: row.id,
      title: row.title.trim() || "Untitled",
      subtitle: "Note",
      href: `/notes/${row.id}`,
    });
  }
  for (const row of tasks.data ?? []) {
    results.push({
      type: "task",
      id: row.id,
      title: row.title,
      subtitle: "Task",
      href: "/tasks",
    });
  }
  for (const row of goals.data ?? []) {
    results.push({
      type: "goal",
      id: row.id,
      title: row.title,
      subtitle: "Goal",
      href: "/goals",
    });
  }
  for (const row of projects.data ?? []) {
    results.push({
      type: "project",
      id: row.id,
      title: row.title.trim() || "Untitled",
      subtitle: "Project",
      href: `/projects/${row.id}`,
    });
  }
  for (const row of journalEntries.data ?? []) {
    results.push({
      type: "journal",
      id: row.id,
      title: formatJournalDate(row.entry_date),
      subtitle: row.content.trim().slice(0, 60) || "Journal entry",
      href: `/journal/${row.id}`,
    });
  }

  return results;
}
