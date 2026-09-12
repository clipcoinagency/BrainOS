"use client";

import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";

import { useDeleteArticle } from "../hooks/use-knowledge";

interface DeleteArticleDialogProps {
  articleId: string;
  articleTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful delete (e.g. to navigate away). */
  onDeleted?: () => void;
}

/**
 * Confirmation dialog for deleting an article. Shared between the articles
 * list (per-card delete) and the article editor (toolbar delete). A thin
 * wrapper over the generic `ConfirmDialog` that wires up the
 * knowledge-specific mutation.
 */
export function DeleteArticleDialog({
  articleId,
  articleTitle,
  open,
  onOpenChange,
  onDeleted,
}: DeleteArticleDialogProps) {
  const deleteArticle = useDeleteArticle();

  function handleConfirm() {
    deleteArticle.mutate(articleId, {
      onSuccess: (result) => {
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        onOpenChange(false);
        onDeleted?.();
      },
      onError: () => {
        toast.error("Failed to delete article. Please try again.");
      },
    });
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete article?"
      description={
        articleTitle ? (
          <>
            &ldquo;{articleTitle}&rdquo; will be permanently deleted. This
            can&apos;t be undone. Any <code>[[{articleTitle}]]</code> links to
            it from other articles will no longer resolve.
          </>
        ) : (
          "This article will be permanently deleted. This can't be undone."
        )
      }
      confirmLabel="Delete"
      destructive
      isPending={deleteArticle.isPending}
      onConfirm={handleConfirm}
    />
  );
}
