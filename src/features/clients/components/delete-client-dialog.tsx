"use client";

import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";

import { useDeleteClient } from "../hooks/use-clients";

interface DeleteClientDialogProps {
  clientId: string;
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteClientDialog({
  clientId,
  clientName,
  open,
  onOpenChange,
}: DeleteClientDialogProps) {
  const deleteClient = useDeleteClient();

  function handleConfirm() {
    deleteClient.mutate(clientId, {
      onSuccess: (result) => {
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        onOpenChange(false);
      },
      onError: () => toast.error("Failed to delete client. Please try again."),
    });
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete client?"
      description={
        clientName ? (
          <>
            &ldquo;{clientName}&rdquo; will be permanently deleted. This
            can&apos;t be undone.
          </>
        ) : (
          "This client will be permanently deleted. This can't be undone."
        )
      }
      confirmLabel="Delete"
      destructive
      isPending={deleteClient.isPending}
      onConfirm={handleConfirm}
    />
  );
}
