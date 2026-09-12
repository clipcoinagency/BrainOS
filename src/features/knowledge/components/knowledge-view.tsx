"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Library, Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { KnowledgeArticle } from "@/lib/supabase/types";

import { useArticlesQuery, useCreateArticle } from "../hooks/use-knowledge";
import { ArticleCard } from "./article-card";
import { DeleteArticleDialog } from "./delete-article-dialog";

export function KnowledgeView({
  initialArticles,
}: {
  initialArticles: KnowledgeArticle[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { data: articles } = useArticlesQuery(initialArticles);
  const createArticle = useCreateArticle();

  // The article pending delete confirmation. Owned here (not inside
  // ArticleCard) so the confirmation dialog stays mounted through its own
  // close transition even though the optimistic delete removes the article —
  // and its card — from this list the instant the user confirms.
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeArticle | null>(
    null,
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter(
      (article) =>
        article.title.toLowerCase().includes(q) ||
        article.content.toLowerCase().includes(q),
    );
  }, [articles, query]);

  function handleCreate() {
    createArticle.mutate(undefined, {
      onSuccess: (result) => {
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        router.push(`/knowledge/${result.data.id}`);
      },
      onError: () => toast.error("Failed to create article."),
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge Base"
        description="A structured wiki for durable knowledge. Link articles with [[Title]]."
        actions={
          <Button onClick={handleCreate} disabled={createArticle.isPending}>
            {createArticle.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            New article
          </Button>
        }
      />

      {articles.length > 0 ? (
        <div className="relative max-w-sm">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search articles…"
            className="pl-8"
            aria-label="Search articles"
          />
        </div>
      ) : null}

      {articles.length === 0 ? (
        <EmptyState
          icon={Library}
          title="No articles yet"
          description="Create your first article to start building your knowledge base."
          action={
            <Button onClick={handleCreate} disabled={createArticle.isPending}>
              {createArticle.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              New article
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching articles"
          description={`Nothing matches "${query}". Try a different search.`}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onRequestDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <DeleteArticleDialog
        articleId={deleteTarget?.id ?? ""}
        articleTitle={
          deleteTarget && deleteTarget.title.trim() !== "Untitled"
            ? deleteTarget.title.trim()
            : ""
        }
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
