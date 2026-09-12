"use client";

import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";

import { useDeleteJournalEntry } from "../hooks/use-journal";

interface DeleteJournalEntryDialogProps {
  entryId: string;
  entryDateLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful delete (e.g. to navigate away). */
  onDeleted?: () => void;
}

/**
 * Confirmation dialog for deleting a journal entry. Shared between the
 * journal list (per-card delete) and the entry editor (toolbar delete). A
 * thin wrapper over the generic `ConfirmDialog` that wires up the
 * journal-specific mutation.
 */
export function DeleteJournalEntryDialog({
  entryId,
  entryDateLabel,
  open,
  onOpenChange,
  onDeleted,
}: DeleteJournalEntryDialogProps) {
  const deleteEntry = useDeleteJournalEntry();

  function handleConfirm() {
    deleteEntry.mutate(entryId, {
      onSuccess: (result) => {
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        onOpenChange(false);
        onDeleted?.();
      },
      onError: () => {
        toast.error("Failed to delete journal entry. Please try again.");
      },
    });
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete entry?"
      description={
        entryDateLabel ? (
          <>
            Your entry for {entryDateLabel} will be permanently deleted. This
            can&apos;t be undone.
          </>
        ) : (
          "This journal entry will be permanently deleted. This can't be undone."
        )
      }
      confirmLabel="Delete"
      destructive
      isPending={deleteEntry.isPending}
      onConfirm={handleConfirm}
    />
  );
}
