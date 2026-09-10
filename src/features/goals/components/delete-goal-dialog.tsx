"use client";

import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";

import { useDeleteGoal } from "../hooks/use-goals";

interface DeleteGoalDialogProps {
  goalId: string;
  goalTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

/**
 * Confirmation dialog for deleting a goal. A thin wrapper over the generic
 * `ConfirmDialog` — mirrors the notes/tasks delete dialogs.
 */
export function DeleteGoalDialog({
  goalId,
  goalTitle,
  open,
  onOpenChange,
  onDeleted,
}: DeleteGoalDialogProps) {
  const deleteGoal = useDeleteGoal();

  function handleConfirm() {
    deleteGoal.mutate(goalId, {
      onSuccess: (result) => {
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        onOpenChange(false);
        onDeleted?.();
      },
      onError: () => {
        toast.error("Failed to delete goal. Please try again.");
      },
    });
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete goal?"
      description={
        goalTitle ? (
          <>
            &ldquo;{goalTitle}&rdquo; will be permanently deleted. This
            can&apos;t be undone.
          </>
        ) : (
          "This goal will be permanently deleted. This can't be undone."
        )
      }
      confirmLabel="Delete"
      destructive
      isPending={deleteGoal.isPending}
      onConfirm={handleConfirm}
    />
  );
}
