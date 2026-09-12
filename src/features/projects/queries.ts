import "server-only";

import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Milestone, Project } from "@/lib/supabase/types";

export interface ProjectWithProgress extends Project {
  milestoneTotal: number;
  milestoneCompleted: number;
}

/**
 * List the current user's projects, each enriched with a milestone
 * completion count for the list view's progress bar.
 *
 * Fetches projects and (all of this user's) milestones in one round trip and
 * rolls the counts up in application code, rather than relying on a
 * PostgREST embedded-resource aggregate — simpler to reason about and to
 * verify without a live database in front of you.
 *
 * Returns an empty array (never throws) when Supabase is not configured or
 * the user is unauthenticated. Wrapped in React's `cache()` so multiple calls
 * within one request share a single fetch.
 */
export const listProjects = cache(async (): Promise<ProjectWithProgress[]> => {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const [projectsResult, milestonesResult] = await Promise.all([
      supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("project_milestones")
        .select("project_id, is_completed")
        .eq("user_id", user.id),
    ]);

    if (projectsResult.error || !projectsResult.data) return [];

    const counts = new Map<string, { total: number; completed: number }>();
    for (const milestone of milestonesResult.data ?? []) {
      const entry = counts.get(milestone.project_id) ?? {
        total: 0,
        completed: 0,
      };
      entry.total += 1;
      if (milestone.is_completed) entry.completed += 1;
      counts.set(milestone.project_id, entry);
    }

    return projectsResult.data.map((project) => {
      const count = counts.get(project.id) ?? { total: 0, completed: 0 };
      return {
        ...project,
        milestoneTotal: count.total,
        milestoneCompleted: count.completed,
      };
    });
  } catch {
    return [];
  }
});

/**
 * Get one project by id, scoped to the current user.
 *
 * Returns `null` if the project doesn't exist, belongs to someone else (RLS
 * already prevents the row from being returned), Supabase is unconfigured, or
 * the request fails.
 */
export const getProject = cache(async (id: string): Promise<Project | null> => {
  if (!isSupabaseConfigured) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    return data;
  } catch {
    return null;
  }
});

/**
 * List a project's milestones in creation order, scoped to the current user.
 * Returns an empty array if the project doesn't exist, isn't owned by the
 * caller, or Supabase is unreachable.
 */
export const listMilestones = cache(
  async (projectId: string): Promise<Milestone[]> => {
    if (!isSupabaseConfigured) return [];

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("project_milestones")
        .select("*")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) return [];
      return data;
    } catch {
      return [];
    }
  },
);
