"use client";

import Link from "next/link";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/lib/supabase/types";

import type { ProjectWithProgress } from "../queries";
import { useUpdateProject } from "../hooks/use-projects";
import {
  getProgressPercent,
  STATUS_BADGE_CLASSNAME,
  STATUS_LABEL,
} from "../lib/progress";
import { getTargetDateStatus } from "../lib/target-date";

interface ProjectCardProps {
  project: ProjectWithProgress;
  onRequestDelete: (project: ProjectWithProgress) => void;
}

export function ProjectCard({ project, onRequestDelete }: ProjectCardProps) {
  const updateProject = useUpdateProject(project.id);

  const title = project.title.trim() || "Untitled project";
  const percent = getProgressPercent(
    project.milestoneCompleted,
    project.milestoneTotal,
  );
  const showStatusBadge = project.status !== "active";
  const targetDate = getTargetDateStatus(project.target_date, project.status);

  function setStatus(status: ProjectStatus) {
    updateProject.mutate(
      { status },
      {
        onSuccess: (result) => {
          if ("error" in result) toast.error(result.error);
        },
        onError: () => toast.error("Failed to update project."),
      },
    );
  }

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group bg-card hover:border-brand/40 focus-visible:ring-ring flex flex-col gap-3 rounded-xl border p-4 text-left transition-all hover:shadow-sm focus-visible:ring-2 focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className={cn(
            "line-clamp-1 text-sm font-medium",
            project.status === "archived" && "text-muted-foreground",
          )}
        >
          {title}
        </h3>

        {/* Stop these controls from triggering the card's Link navigation. */}
        <div
          className="flex shrink-0 items-center gap-1"
          onClick={(event) => event.preventDefault()}
        >
          {showStatusBadge ? (
            <Badge
              variant="outline"
              className={cn(
                "border-transparent",
                STATUS_BADGE_CLASSNAME[project.status],
              )}
            >
              {STATUS_LABEL[project.status]}
            </Badge>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Project actions"
                className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 has-data-[state=open]:opacity-100"
              >
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {project.status !== "completed" ? (
                <DropdownMenuItem onSelect={() => setStatus("completed")}>
                  Mark completed
                </DropdownMenuItem>
              ) : null}
              {project.status !== "active" ? (
                <DropdownMenuItem onSelect={() => setStatus("active")}>
                  Reactivate
                </DropdownMenuItem>
              ) : null}
              {project.status !== "archived" ? (
                <DropdownMenuItem onSelect={() => setStatus("archived")}>
                  Archive
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => onRequestDelete(project)}
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {project.description.trim() ? (
        <p className="text-muted-foreground line-clamp-2 text-xs text-pretty">
          {project.description.trim()}
        </p>
      ) : null}

      {percent !== null ? (
        <div className="space-y-1.5">
          <Progress value={percent} aria-label={`${title} progress`} />
          <p className="text-muted-foreground text-[11px] tabular-nums">
            {project.milestoneCompleted} / {project.milestoneTotal} milestones ·{" "}
            {percent}%
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground/60 text-[11px] italic">
          No milestones yet
        </p>
      )}

      {targetDate ? (
        <p className={cn("text-[11px]", targetDate.className)}>
          {targetDate.label}
        </p>
      ) : null}
    </Link>
  );
}
