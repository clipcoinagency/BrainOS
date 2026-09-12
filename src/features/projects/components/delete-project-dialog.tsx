"use client";

import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";

import { useDeleteProject } from "../hooks/use-projects";

interface DeleteProjectDialogProps {
  projectId: string;
  projectTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
  /** Where focus lands after the dialog closes. */
  finalFocusRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Confirmation dialog for deleting a project (and, via cascade, all of its
 * milestones). A thin wrapper over the generic `ConfirmDialog` — mirrors the
 * notes/tasks/goals delete dialogs.
 */
export function DeleteProjectDialog({
  projectId,
  projectTitle,
  open,
  onOpenChange,
  onDeleted,
  finalFocusRef,
}: DeleteProjectDialogProps) {
  const deleteProject = useDeleteProject();

  function handleConfirm() {
    deleteProject.mutate(projectId, {
      onSuccess: (result) => {
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        onOpenChange(false);
        onDeleted?.();
      },
      onError: () => {
        toast.error("Failed to delete project. Please try again.");
      },
    });
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete project?"
      description={
        projectTitle ? (
          <>
            &ldquo;{projectTitle}&rdquo; and all of its milestones will be
            permanently deleted. This can&apos;t be undone.
          </>
        ) : (
          "This project and all of its milestones will be permanently deleted. This can't be undone."
        )
      }
      confirmLabel="Delete"
      destructive
      isPending={deleteProject.isPending}
      onConfirm={handleConfirm}
      finalFocusRef={finalFocusRef}
    />
  );
}
