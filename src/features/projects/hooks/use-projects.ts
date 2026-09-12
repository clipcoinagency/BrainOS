"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Milestone } from "@/lib/supabase/types";

import {
  createMilestone,
  createProject,
  deleteMilestone,
  deleteProject,
  listMilestonesAction,
  listProjectsAction,
  toggleMilestoneComplete,
  updateProject,
} from "../actions";
import type {
  CreateMilestoneInput,
  CreateProjectInput,
  UpdateProjectInput,
} from "../schemas";
import type { ProjectWithProgress } from "../queries";

export const projectKeys = {
  all: ["projects"] as const,
  milestones: (projectId: string) =>
    ["projects", projectId, "milestones"] as const,
};

/** One TanStack Query mutation `scope` per project, shared by every mutation
 * that writes to that project's own fields. Same-scope mutations are
 * serialized — see the notes/tasks/goals features for the review finding
 * this pattern fixes. */
function projectScope(id: string) {
  return { id: `project-${id}` };
}

/** One scope per milestone, for the same reason. */
function milestoneScope(id: string) {
  return { id: `milestone-${id}` };
}

/**
 * The projects list, seeded with server-fetched `initialData` so there is no
 * loading flash on first paint.
 */
export function useProjectsQuery(initialData: ProjectWithProgress[]) {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: () => listProjectsAction(),
    initialData,
  });
}

/** A single project's milestones, seeded from the server. */
export function useMilestonesQuery(
  projectId: string,
  initialData: Milestone[],
) {
  return useQuery({
    queryKey: projectKeys.milestones(projectId),
    queryFn: () => listMilestonesAction(projectId),
    initialData,
  });
}

/** Create a project from a title (the "quick add" flow). */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectInput) => createProject(input),
    onSuccess: (result) => {
      if ("data" in result) {
        queryClient.invalidateQueries({ queryKey: projectKeys.all });
      }
    },
  });
}

/** Update a project's fields. Scoped to `projectId`. */
export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    scope: projectScope(projectId),
    mutationFn: (input: UpdateProjectInput) => updateProject(projectId, input),
    onSuccess: (result) => {
      if ("data" in result) {
        queryClient.invalidateQueries({ queryKey: projectKeys.all });
      }
    },
  });
}

/** Delete a project with an optimistic removal from the list. */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.all });
      const previous = queryClient.getQueryData<ProjectWithProgress[]>(
        projectKeys.all,
      );

      queryClient.setQueryData<ProjectWithProgress[]>(
        projectKeys.all,
        (projects) => projects?.filter((project) => project.id !== id),
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(projectKeys.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

/** Create a milestone under a project. */
export function useCreateMilestone(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMilestoneInput) =>
      createMilestone(projectId, input),
    onSuccess: (result) => {
      if ("data" in result) {
        queryClient.invalidateQueries({
          queryKey: projectKeys.milestones(projectId),
        });
        // The list view's per-project progress rollup also changed.
        queryClient.invalidateQueries({ queryKey: projectKeys.all });
      }
    },
  });
}

/**
 * Toggle one milestone's completion, with an optimistic update to its
 * project's milestone list. Takes both ids so it can be called fresh per
 * milestone row (mirrors `useToggleNotePin(noteId)` / `useUpdateGoalProgress
 * (goalId)`) — `scope` is set once per hook instance, not per `.mutate()`
 * call, so the entity id has to be bound at the hook-call site, not passed as
 * a mutate variable.
 */
export function useToggleMilestoneComplete(
  projectId: string,
  milestoneId: string,
) {
  const queryClient = useQueryClient();
  const milestonesKey = projectKeys.milestones(projectId);

  return useMutation({
    scope: milestoneScope(milestoneId),
    mutationFn: (isCompleted: boolean) =>
      toggleMilestoneComplete(milestoneId, isCompleted),
    onMutate: async (isCompleted) => {
      await queryClient.cancelQueries({ queryKey: milestonesKey });
      const previous = queryClient.getQueryData<Milestone[]>(milestonesKey);

      queryClient.setQueryData<Milestone[]>(milestonesKey, (milestones) =>
        milestones?.map((milestone) =>
          milestone.id === milestoneId
            ? { ...milestone, is_completed: isCompleted }
            : milestone,
        ),
      );

      return { previous };
    },
    onError: (_err, _isCompleted, context) => {
      if (context?.previous) {
        queryClient.setQueryData(milestonesKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: milestonesKey });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

/** Delete a milestone with an optimistic removal from its project's list. */
export function useDeleteMilestone(projectId: string) {
  const queryClient = useQueryClient();
  const milestonesKey = projectKeys.milestones(projectId);

  return useMutation({
    mutationFn: (id: string) => deleteMilestone(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: milestonesKey });
      const previous = queryClient.getQueryData<Milestone[]>(milestonesKey);

      queryClient.setQueryData<Milestone[]>(milestonesKey, (milestones) =>
        milestones?.filter((milestone) => milestone.id !== id),
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(milestonesKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: milestonesKey });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
