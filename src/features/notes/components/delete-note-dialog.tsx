"use client";

import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";

import { useDeleteNote } from "../hooks/use-notes";

interface DeleteNoteDialogProps {
  noteId: string;
  noteTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful delete (e.g. to navigate away). */
  onDeleted?: () => void;
}

/**
 * Confirmation dialog for deleting a note. Shared between the notes list
 * (per-card delete) and the note editor (toolbar delete). A thin wrapper over
 * the generic `ConfirmDialog` that wires up the notes-specific mutation.
 */
export function DeleteNoteDialog({
  noteId,
  noteTitle,
  open,
  onOpenChange,
  onDeleted,
}: DeleteNoteDialogProps) {
  const deleteNote = useDeleteNote();

  function handleConfirm() {
    deleteNote.mutate(noteId, {
      onSuccess: (result) => {
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        onOpenChange(false);
        onDeleted?.();
      },
      onError: () => {
        toast.error("Failed to delete note. Please try again.");
      },
    });
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete note?"
      description={
        noteTitle ? (
          <>
            &ldquo;{noteTitle}&rdquo; will be permanently deleted. This
            can&apos;t be undone.
          </>
        ) : (
          "This note will be permanently deleted. This can't be undone."
        )
      }
      confirmLabel="Delete"
      destructive
      isPending={deleteNote.isPending}
      onConfirm={handleConfirm}
    />
  );
}
