"use client";

import { Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as destructive (red) — use for delete/remove actions. */
  destructive?: boolean;
  /** Shows a spinner and disables both buttons while a confirm action is in flight. */
  isPending?: boolean;
  onConfirm: () => void;
}

/**
 * A generic yes/no confirmation dialog, decoupled from any specific mutation.
 * The caller owns the mutation and passes `onConfirm` + `isPending`.
 *
 * Shared because two features (Notes, Tasks) need the identical "confirm
 * before deleting a row" flow — see each feature's `delete-<name>-dialog.tsx`
 * (under its `components` folder) for the thin, feature-specific wrappers
 * built on top of this.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  isPending = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              // Keep the dialog open until the caller decides otherwise (e.g.
              // on mutation success) — Radix would otherwise close it
              // immediately, before an async action has resolved.
              event.preventDefault();
              onConfirm();
            }}
            disabled={isPending}
            className={cn(
              destructive &&
                "bg-destructive hover:bg-destructive/90 text-white",
            )}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
