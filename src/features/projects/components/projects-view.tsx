"use client";

import { Fragment, useMemo, useRef, useState } from "react";
import { FolderKanban, Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useCreateProject, useProjectsQuery } from "../hooks/use-projects";
import { STATUS_LABEL, STATUS_ORDER } from "../lib/progress";
import type { ProjectWithProgress } from "../queries";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { ProjectCard } from "./project-card";

function compareProjects(
  a: ProjectWithProgress,
  b: ProjectWithProgress,
): number {
  if (a.status !== b.status) {
    return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  }

  if (a.status === "active") {
    // Soonest target date first (no date sorts last), then newest created.
    const aDue = a.target_date ? new Date(a.target_date).getTime() : Infinity;
    const bDue = b.target_date ? new Date(b.target_date).getTime() : Infinity;
    if (aDue !== bDue) return aDue - bDue;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }

  // Completed / archived: most recently touched first.
  return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
}

export function ProjectsView({
  initialProjects,
}: {
  initialProjects: ProjectWithProgress[];
}) {
  const [query, setQuery] = useState("");
  const [quickAdd, setQuickAdd] = useState("");
  const { data: projects } = useProjectsQuery(initialProjects);
  const createProject = useCreateProject();

  // A stable place to send focus after a delete removes the acted-on card
  // (and the menu control that opened the confirmation).
  const quickAddRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectWithProgress | null>(
    null,
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (project) =>
        project.title.toLowerCase().includes(q) ||
        project.description.toLowerCase().includes(q),
    );
  }, [projects, query]);

  // One sorted array under one parent grid — not separate arrays per status
  // group under separate containers — so React matches cards by key across a
  // status change instead of unmounting/remounting the card the user just
  // acted on. See the Notes feature for the bug this avoids.
  const sorted = useMemo(() => [...filtered].sort(compareProjects), [filtered]);
  const firstCompletedIndex = sorted.findIndex((p) => p.status === "completed");
  const firstArchivedIndex = sorted.findIndex((p) => p.status === "archived");

  function handleQuickAdd(event: React.FormEvent) {
    event.preventDefault();
    const title = quickAdd.trim();
    if (!title) return;

    createProject.mutate(
      { title },
      {
        onSuccess: (result) => {
          if ("error" in result) {
            toast.error(result.error);
            return;
          }
          setQuickAdd("");
        },
        onError: () => toast.error("Failed to create project."),
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Organize work into projects and milestones."
      />

      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <Input
          ref={quickAddRef}
          value={quickAdd}
          onChange={(event) => setQuickAdd(event.target.value)}
          placeholder="Name a project and press Enter…"
          aria-label="New project title"
        />
        <Button
          type="submit"
          disabled={createProject.isPending || !quickAdd.trim()}
        >
          {createProject.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Add
        </Button>
      </form>

      {projects.length > 0 ? (
        <div className="relative max-w-sm">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects…"
            className="pl-8"
            aria-label="Search projects"
          />
        </div>
      ) : null}

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Name your first project above, then break it into milestones."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching projects"
          description={`Nothing matches "${query}". Try a different search.`}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((project, index) => (
            <Fragment key={project.id}>
              {index === firstCompletedIndex && firstCompletedIndex > 0 ? (
                <h2 className="text-muted-foreground col-span-full text-xs font-medium tracking-wider uppercase">
                  {STATUS_LABEL.completed}
                </h2>
              ) : null}
              {index === firstArchivedIndex && firstArchivedIndex > 0 ? (
                <h2 className="text-muted-foreground col-span-full text-xs font-medium tracking-wider uppercase">
                  {STATUS_LABEL.archived}
                </h2>
              ) : null}
              <ProjectCard
                project={project}
                onRequestDelete={setDeleteTarget}
              />
            </Fragment>
          ))}
        </div>
      )}

      <DeleteProjectDialog
        projectId={deleteTarget?.id ?? ""}
        projectTitle={deleteTarget?.title.trim() ?? ""}
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        finalFocusRef={quickAddRef}
      />
    </div>
  );
}
