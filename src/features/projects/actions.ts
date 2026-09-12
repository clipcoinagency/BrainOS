"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { requireUser } from "@/lib/supabase/require-user";
import type { Milestone, Project } from "@/lib/supabase/types";

import {
  createMilestoneSchema,
  createProjectSchema,
  updateProjectSchema,
} from "./schemas";
import type {
  CreateMilestoneInput,
  CreateProjectInput,
  UpdateProjectInput,
} from "./schemas";
import { getProject, listMilestones, listProjects } from "./queries";
import type { ProjectWithProgress } from "./queries";

/** Discriminated result returned to the client. */
export type ProjectResult<T> = { data: T } | { error: string };

const PROJECT_NOT_FOUND = "Project not found.";
const MILESTONE_NOT_FOUND = "Milestone not found.";

// Server Actions are reachable by any authenticated browser (devtools, a
// hand-crafted request), not just through our UI — validate id shapes so a
// malformed value fails with our own generic message instead of a raw
// Postgres type-cast error. Mirrors the notes/tasks/goals features.
const projectIdSchema = z.string().uuid();
const milestoneIdSchema = z.string().uuid();

function revalidateProjects(id?: string) {
  revalidatePath("/projects");
  if (id) revalidatePath(`/projects/${id}`);
}

// --- Projects ----------------------------------------------------------------

/**
 * List the current user's projects. A "use server" bridge over
 * `queries.listProjects` so Client Components (e.g. a TanStack Query
 * `queryFn`) can call it — direct imports of `queries.ts` are blocked by its
 * `server-only` guard.
 */
export async function listProjectsAction(): Promise<ProjectWithProgress[]> {
  return listProjects();
}

/** Get one project by id. See {@link listProjectsAction} for why this bridges `queries.ts`. */
export async function getProjectAction(id: string): Promise<Project | null> {
  if (!projectIdSchema.safeParse(id).success) return null;
  return getProject(id);
}

/** Create a project from just a title (the "quick add" flow). */
export async function createProject(
  input: CreateProjectInput,
): Promise<ProjectResult<Project>> {
  const ctx = await requireUser("Projects");
  if ("error" in ctx) return { error: ctx.error };

  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Please check the project and try again.",
    };
  }

  const { supabase, user } = ctx;
  const { data, error } = await supabase
    .from("projects")
    .insert({ user_id: user.id, title: parsed.data.title })
    .select()
    .single();

  if (error || !data) return { error: "Failed to create project." };

  revalidateProjects();
  return { data };
}

/** Update a project's title, description, status, and/or target date. */
export async function updateProject(
  id: string,
  input: UpdateProjectInput,
): Promise<ProjectResult<Project>> {
  if (!projectIdSchema.safeParse(id).success)
    return { error: PROJECT_NOT_FOUND };

  const ctx = await requireUser("Projects");
  if ("error" in ctx) return { error: ctx.error };

  const parsed = updateProjectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Please check the project and try again.",
    };
  }

  const { title, description, status, targetDate } = parsed.data;
  if (
    title === undefined &&
    description === undefined &&
    status === undefined &&
    targetDate === undefined
  ) {
    return { error: "Nothing to update." };
  }

  const { supabase, user } = ctx;
  const { data, error } = await supabase
    .from("projects")
    .update({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(targetDate !== undefined && { target_date: targetDate }),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  // No matching row (wrong owner, or deleted between click and request) and a
  // genuine database error both land here — .single() errors either way, and
  // callers only need to know the update didn't happen.
  if (error || !data) return { error: "Failed to update project." };

  revalidateProjects(id);
  return { data };
}

/** Delete a project. Cascades to its milestones via the FK. */
export async function deleteProject(
  id: string,
): Promise<ProjectResult<{ id: string }>> {
  if (!projectIdSchema.safeParse(id).success)
    return { error: PROJECT_NOT_FOUND };

  const ctx = await requireUser("Projects");
  if ("error" in ctx) return { error: ctx.error };

  const { supabase, user } = ctx;
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "Failed to delete project." };

  revalidateProjects(id);
  return { data: { id } };
}

// --- Milestones ----------------------------------------------------------------

/** List a project's milestones. A "use server" bridge over `queries.listMilestones`. */
export async function listMilestonesAction(
  projectId: string,
): Promise<Milestone[]> {
  if (!projectIdSchema.safeParse(projectId).success) return [];
  return listMilestones(projectId);
}

/**
 * Create a milestone under a project.
 *
 * `projectId` is client-supplied, so this explicitly verifies the project
 * both exists and belongs to the caller BEFORE inserting — the milestone
 * row's own RLS policy only checks `user_id = auth.uid()` (identical to
 * every other table's policy), which alone would let a signed-in user
 * successfully insert a milestone with a `project_id` pointing at a project
 * they don't own. That insert would still carry the caller's own `user_id`
 * (so RLS lets them see the resulting row, and it wouldn't leak the other
 * project's data), but it corrupts the app's own referential integrity —
 * this check is what actually keeps a milestone's project_id trustworthy.
 */
export async function createMilestone(
  projectId: string,
  input: CreateMilestoneInput,
): Promise<ProjectResult<Milestone>> {
  if (!projectIdSchema.safeParse(projectId).success) {
    return { error: PROJECT_NOT_FOUND };
  }

  const ctx = await requireUser("Projects");
  if ("error" in ctx) return { error: ctx.error };

  const parsed = createMilestoneSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Please check the milestone and try again.",
    };
  }

  const { supabase, user } = ctx;

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!project) return { error: PROJECT_NOT_FOUND };

  const { data, error } = await supabase
    .from("project_milestones")
    .insert({
      project_id: projectId,
      user_id: user.id,
      title: parsed.data.title,
    })
    .select()
    .single();

  if (error || !data) return { error: "Failed to create milestone." };

  revalidateProjects(projectId);
  return { data };
}

/** Toggle a milestone's completion. */
export async function toggleMilestoneComplete(
  id: string,
  isCompleted: boolean,
): Promise<ProjectResult<Milestone>> {
  if (!milestoneIdSchema.safeParse(id).success) {
    return { error: MILESTONE_NOT_FOUND };
  }
  if (typeof isCompleted !== "boolean") {
    return { error: "Please check the milestone and try again." };
  }

  const ctx = await requireUser("Projects");
  if ("error" in ctx) return { error: ctx.error };

  const { supabase, user } = ctx;
  const { data, error } = await supabase
    .from("project_milestones")
    .update({ is_completed: isCompleted })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !data) return { error: "Failed to update milestone." };

  revalidateProjects(data.project_id);
  return { data };
}

/** Delete a milestone. */
export async function deleteMilestone(
  id: string,
): Promise<ProjectResult<{ id: string }>> {
  if (!milestoneIdSchema.safeParse(id).success) {
    return { error: MILESTONE_NOT_FOUND };
  }

  const ctx = await requireUser("Projects");
  if ("error" in ctx) return { error: ctx.error };

  const { supabase, user } = ctx;

  // Fetch first (scoped to the caller) so we know which project to
  // revalidate — the delete response itself doesn't return the row.
  const { data: milestone } = await supabase
    .from("project_milestones")
    .select("project_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!milestone) return { error: MILESTONE_NOT_FOUND };

  const { error } = await supabase
    .from("project_milestones")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "Failed to delete milestone." };

  revalidateProjects(milestone.project_id);
  return { data: { id } };
}
