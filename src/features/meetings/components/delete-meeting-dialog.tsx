"use client";

import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";

import { useDeleteMeeting } from "../hooks/use-meetings";

interface DeleteMeetingDialogProps {
  meetingId: string;
  meetingTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful delete (e.g. to navigate away). */
  onDeleted?: () => void;
}

export function DeleteMeetingDialog({
  meetingId,
  meetingTitle,
  open,
  onOpenChange,
  onDeleted,
}: DeleteMeetingDialogProps) {
  const deleteMeeting = useDeleteMeeting();

  function handleConfirm() {
    deleteMeeting.mutate(meetingId, {
      onSuccess: (result) => {
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        onOpenChange(false);
        onDeleted?.();
      },
      onError: () => {
        toast.error("Failed to delete meeting. Please try again.");
      },
    });
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete meeting?"
      description={
        meetingTitle ? (
          <>
            &ldquo;{meetingTitle}&rdquo; will be permanently deleted. This
            can&apos;t be undone.
          </>
        ) : (
          "This meeting will be permanently deleted. This can't be undone."
        )
      }
      confirmLabel="Delete"
      destructive
      isPending={deleteMeeting.isPending}
      onConfirm={handleConfirm}
    />
  );
}
