"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Link2, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { KnowledgeArticle } from "@/lib/supabase/types";

import { useArticlesQuery, useUpdateArticle } from "../hooks/use-knowledge";
import { extractWikiLinks } from "../lib/wiki-links";
import { DeleteArticleDialog } from "./delete-article-dialog";

const AUTOSAVE_DELAY_MS = 800;

interface ArticleEditorProps {
  article: KnowledgeArticle;
  /** Every article the user has (for resolving `[[Title]]` references in
   * this one's content to a real article id) — fetched server-side
   * alongside `article` itself so outgoing links resolve correctly even on
   * a first visit, before `/knowledge`'s own list query has ever run. */
  allArticles: KnowledgeArticle[];
  /** Other articles that reference this one via `[[title]]`, fetched
   * server-side (see `listBacklinks`). Read-only and not live-updated —
   * good enough for a wiki's "what links here" panel. */
  backlinks: Pick<KnowledgeArticle, "id" | "title" | "updated_at">[];
}

export function ArticleEditor({
  article,
  allArticles,
  backlinks,
}: ArticleEditorProps) {
  const router = useRouter();
  const updateArticle = useUpdateArticle(article.id);
  // Same queryKey as the knowledge list — if the user already visited
  // /knowledge this reuses that cache; otherwise `allArticles` (fetched
  // server-side for this exact page) seeds it, so outgoing-link resolution
  // below never depends on the user having visited the list first.
  const { data: articles } = useArticlesQuery(allArticles);

  const [title, setTitle] = useState(article.title);
  const [content, setContent] = useState(article.content);
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const debouncedSave = useDebouncedCallback(
    (nextTitle: string, nextContent: string) => {
      updateArticle.mutate(
        { title: nextTitle, content: nextContent },
        {
          onSuccess: (result) => {
            if ("error" in result) {
              toast.error(result.error);
              return;
            }
            setDirty(false);
            setLastSavedAt(new Date());
          },
          onError: () =>
            toast.error(
              "Failed to save. Your changes are kept locally — try again.",
            ),
        },
      );
    },
    AUTOSAVE_DELAY_MS,
  );

  function handleTitleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setTitle(value);
    setDirty(true);
    debouncedSave(value, content);
  }

  function handleContentChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = event.target.value;
    setContent(value);
    setDirty(true);
    debouncedSave(title, value);
  }

  // Resolve this article's own [[Title]] references against every other
  // article the user has. A reference with no matching title still shows —
  // just without a link — so the author can see it's not created yet.
  const outgoingLinks = useMemo(() => {
    return extractWikiLinks(content).map((linkTitle) => {
      const target = articles.find(
        (candidate) =>
          candidate.id !== article.id &&
          candidate.title.trim().toLowerCase() === linkTitle.toLowerCase(),
      );
      return { title: linkTitle, articleId: target?.id ?? null };
    });
  }, [content, articles, article.id]);

  const status = updateArticle.isPending
    ? "Saving…"
    : dirty
      ? "Unsaved changes"
      : lastSavedAt
        ? `Saved ${formatRelativeTime(lastSavedAt)}`
        : `Saved ${formatRelativeTime(article.updated_at)}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/knowledge">
            <ArrowLeft className="size-4" />
            Knowledge Base
          </Link>
        </Button>

        <div className="flex items-center gap-1">
          <span
            aria-live="polite"
            className="text-muted-foreground mr-1 flex items-center gap-1 text-xs"
          >
            {updateArticle.isPending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : !dirty ? (
              <Check className="size-3" />
            ) : null}
            {status}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete article"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <Input
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          aria-label="Title"
          autoFocus
          className="h-auto border-none bg-transparent px-0 text-2xl font-semibold shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <Textarea
          value={content}
          onChange={handleContentChange}
          placeholder="Start writing… link other articles with [[Title]]"
          aria-label="Article content"
          className="text-foreground min-h-[45vh] resize-none border-none px-0 text-sm leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
      </div>

      {outgoingLinks.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wider uppercase">
            <Link2 className="size-3.5" />
            Links to
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {outgoingLinks.map(({ title: linkTitle, articleId }) =>
              articleId ? (
                <Link
                  key={linkTitle}
                  href={`/knowledge/${articleId}`}
                  className="bg-brand/10 text-brand hover:bg-brand/20 rounded-full px-2.5 py-1 text-xs transition-colors"
                >
                  {linkTitle}
                </Link>
              ) : (
                <span
                  key={linkTitle}
                  className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs"
                  title="No article with this title yet"
                >
                  {linkTitle}
                </span>
              ),
            )}
          </div>
        </div>
      ) : null}

      {backlinks.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wider uppercase">
            <Link2 className="size-3.5" />
            Linked from
          </h2>
          <div className="space-y-1">
            {backlinks.map((backlink) => (
              <Link
                key={backlink.id}
                href={`/knowledge/${backlink.id}`}
                className={cn(
                  "hover:bg-muted flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors",
                )}
              >
                <span className="truncate">
                  {backlink.title.trim() || "Untitled"}
                </span>
                <span className="text-muted-foreground text-xs">
                  {formatRelativeTime(backlink.updated_at)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <DeleteArticleDialog
        articleId={article.id}
        articleTitle={title.trim()}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.push("/knowledge")}
      />
    </div>
  );
}
