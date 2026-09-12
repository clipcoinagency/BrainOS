"use client";

import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";

import { useDeleteHabit } from "../hooks/use-habits";

interface DeleteHabitDialogProps {
  habitId: string;
  habitTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteHabitDialog({
  habitId,
  habitTitle,
  open,
  onOpenChange,
}: DeleteHabitDialogProps) {
  const deleteHabit = useDeleteHabit();

  function handleConfirm() {
    deleteHabit.mutate(habitId, {
      onSuccess: (result) => {
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        onOpenChange(false);
      },
      onError: () => toast.error("Failed to delete habit. Please try again."),
    });
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete habit?"
      description={
        habitTitle ? (
          <>
            &ldquo;{habitTitle}&rdquo; and its entire completion history will be
            permanently deleted. This can&apos;t be undone.
          </>
        ) : (
          "This habit and its entire completion history will be permanently deleted. This can't be undone."
        )
      }
      confirmLabel="Delete"
      destructive
      isPending={deleteHabit.isPending}
      onConfirm={handleConfirm}
    />
  );
}
