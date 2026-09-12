"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { formatRelativeTime } from "@/lib/format";
import type { Project, ProjectStatus } from "@/lib/supabase/types";

import { useUpdateProject } from "../hooks/use-projects";
import { STATUS_LABEL } from "../lib/progress";
import { DeleteProjectDialog } from "./delete-project-dialog";

const AUTOSAVE_DELAY_MS = 800;

/**
 * The project detail page's header: title/description autosave (debounced,
 * like the notes editor), plus status and target date, which save
 * immediately on change since neither is typed character-by-character. All
 * three go through the SAME `useUpdateProject` instance, so they share one
 * mutation scope and can't race each other (see the notes/tasks/goals
 * features for the review finding this pattern fixes).
 */
export function ProjectEditor({ project }: { project: Project }) {
  const router = useRouter();
  const updateProject = useUpdateProject(project.id);

  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);
  // Local + optimistic, not bound to `project.status`/`project.target_date`
  // directly: the `project` prop comes from the Server Component page and
  // only refreshes on a full navigation, so a Select/Input bound straight to
  // it would keep showing the pre-change value even after the mutation
  // succeeds. Mirrors the note editor's `isPinned` local state.
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [targetDate, setTargetDate] = useState(project.target_date ?? "");
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const debouncedSave = useDebouncedCallback(
    (nextTitle: string, nextDescription: string) => {
      updateProject.mutate(
        { title: nextTitle, description: nextDescription },
        {
          onSuccess: (result) => {
            if ("error" in result) {
              toast.error(result.error);
              return;
            }
            setDirty(false);
            setLastSavedAt(new Date());
          },
          onError: () =>
            toast.error(
              "Failed to save. Your changes are kept locally — try again.",
            ),
        },
      );
    },
    AUTOSAVE_DELAY_MS,
  );

  function handleTitleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setTitle(value);
    setDirty(true);
    debouncedSave(value, description);
  }

  function handleDescriptionChange(
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) {
    const value = event.target.value;
    setDescription(value);
    setDirty(true);
    debouncedSave(title, value);
  }

  function handleStatusChange(next: ProjectStatus) {
    const previous = status;
    setStatus(next);
    updateProject.mutate(
      { status: next },
      {
        onSuccess: (result) => {
          if ("error" in result) {
            setStatus(previous);
            toast.error(result.error);
          }
        },
        onError: () => {
          setStatus(previous);
          toast.error("Failed to update project.");
        },
      },
    );
  }

  function handleTargetDateChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    const previous = targetDate;
    setTargetDate(value);
    updateProject.mutate(
      { targetDate: value === "" ? null : value },
      {
        onSuccess: (result) => {
          if ("error" in result) {
            setTargetDate(previous);
            toast.error(result.error);
          }
        },
        onError: () => {
          setTargetDate(previous);
          toast.error("Failed to update project.");
        },
      },
    );
  }

  const saveStatus = updateProject.isPending
    ? "Saving…"
    : dirty
      ? "Unsaved changes"
      : lastSavedAt
        ? `Saved ${formatRelativeTime(lastSavedAt)}`
        : `Saved ${formatRelativeTime(project.updated_at)}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/projects">
            <ArrowLeft className="size-4" />
            Projects
          </Link>
        </Button>

        <div className="flex items-center gap-1">
          <span className="text-muted-foreground mr-1 flex items-center gap-1 text-xs">
            {updateProject.isPending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : !dirty ? (
              <Check className="size-3" />
            ) : null}
            {saveStatus}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete project"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <Input
        value={title}
        onChange={handleTitleChange}
        placeholder="Untitled"
        aria-label="Title"
        // Lands the cursor here right after "quick add" navigates to this
        // page, and is a harmless, expected default when opening any project.
        autoFocus
        className="h-auto border-none bg-transparent px-0 text-2xl font-semibold shadow-none focus-visible:ring-0 dark:bg-transparent"
      />

      <Textarea
        value={description}
        onChange={handleDescriptionChange}
        placeholder="What is this project about?"
        aria-label="Description"
        className="min-h-24 border-none bg-transparent px-0 text-sm leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label
            htmlFor="project-status"
            className="text-muted-foreground text-xs font-medium"
          >
            Status
          </label>
          <Select
            value={status}
            onValueChange={(value) =>
              handleStatusChange(value as ProjectStatus)
            }
          >
            <SelectTrigger id="project-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_LABEL) as ProjectStatus[]).map((value) => (
                <SelectItem key={value} value={value}>
                  {STATUS_LABEL[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="project-target-date"
            className="text-muted-foreground text-xs font-medium"
          >
            Target date
          </label>
          <Input
            id="project-target-date"
            type="date"
            value={targetDate}
            onChange={handleTargetDateChange}
          />
        </div>
      </div>

      <DeleteProjectDialog
        projectId={project.id}
        projectTitle={title.trim()}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.push("/projects")}
      />
    </div>
  );
}
