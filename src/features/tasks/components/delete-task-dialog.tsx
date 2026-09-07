"use client";

import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";

import { useDeleteTask } from "../hooks/use-tasks";

interface DeleteTaskDialogProps {
  taskId: string;
  taskTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

/**
 * Confirmation dialog for deleting a task. A thin wrapper over the generic
 * `ConfirmDialog` that wires up the tasks-specific mutation — mirrors
 * `src/features/notes/components/delete-note-dialog.tsx`.
 */
export function DeleteTaskDialog({
  taskId,
  taskTitle,
  open,
  onOpenChange,
  onDeleted,
}: DeleteTaskDialogProps) {
  const deleteTask = useDeleteTask();

  function handleConfirm() {
    deleteTask.mutate(taskId, {
      onSuccess: (result) => {
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        onOpenChange(false);
        onDeleted?.();
      },
      onError: () => {
        toast.error("Failed to delete task. Please try again.");
      },
    });
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete task?"
      description={
        taskTitle ? (
          <>
            &ldquo;{taskTitle}&rdquo; will be permanently deleted. This
            can&apos;t be undone.
          </>
        ) : (
          "This task will be permanently deleted. This can't be undone."
        )
      }
      confirmLabel="Delete"
      destructive
      isPending={deleteTask.isPending}
      onConfirm={handleConfirm}
    />
  );
}
