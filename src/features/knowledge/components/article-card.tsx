"use client";

import Link from "next/link";
import { MoreHorizontal, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format";
import type { KnowledgeArticle } from "@/lib/supabase/types";

interface ArticleCardProps {
  article: KnowledgeArticle;
  /** Ask the parent to open the delete-confirmation flow for this article.
   * The dialog itself lives in `KnowledgeView`, not here — an optimistic
   * delete removes the article (and anything mounted inside it) the instant
   * it's confirmed. */
  onRequestDelete: (article: KnowledgeArticle) => void;
}

export function ArticleCard({ article, onRequestDelete }: ArticleCardProps) {
  const title = article.title.trim() || "Untitled";
  const preview = article.content.trim();

  return (
    <Link
      href={`/knowledge/${article.id}`}
      className="group bg-card hover:border-brand/40 focus-visible:ring-ring relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all hover:shadow-sm focus-visible:ring-2 focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-1 text-sm font-medium">{title}</h3>

        {/* Stops the click from triggering the card's Link navigation.
            Visible on hover, when the dropdown is open, OR when keyboard
            focus lands on it (group-focus-within). */}
        <div
          className="-mt-1 -mr-1 flex items-center gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 has-data-[state=open]:opacity-100"
          onClick={(event) => event.preventDefault()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Article actions"
              >
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => onRequestDelete(article)}
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {preview ? (
        <p className="text-muted-foreground line-clamp-3 text-xs text-pretty whitespace-pre-line">
          {preview}
        </p>
      ) : (
        <p className="text-muted-foreground/60 text-xs italic">No content</p>
      )}

      <p className="text-muted-foreground/60 mt-auto pt-1 text-[11px]">
        {formatRelativeTime(article.updated_at)}
      </p>
    </Link>
  );
}
