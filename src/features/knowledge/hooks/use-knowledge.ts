"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { KnowledgeArticle } from "@/lib/supabase/types";

import {
  createArticle,
  deleteArticle,
  listArticlesAction,
  updateArticle,
} from "../actions";
import type { CreateArticleInput, UpdateArticleInput } from "../schemas";

export const knowledgeKeys = {
  all: ["knowledge-articles"] as const,
};

/** One TanStack Query mutation `scope` per article, shared by every mutation
 * that writes to that article (autosave) — see the notes feature's
 * `use-notes.ts` for why same-entity writes need to be serialized this way. */
function articleScope(id: string) {
  return { id: `knowledge-article-${id}` };
}

/**
 * The articles list, seeded with server-fetched `initialData` so there is no
 * loading flash on first paint. Subsequent refetches (after mutations) go
 * through `listArticlesAction`, a "use server" bridge to the server-only
 * query.
 */
export function useArticlesQuery(initialData: KnowledgeArticle[]) {
  return useQuery({
    queryKey: knowledgeKeys.all,
    queryFn: () => listArticlesAction(),
    initialData,
  });
}

/** Create an article. Callers typically navigate to the new article on
 * success. */
export function useCreateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input?: CreateArticleInput) => createArticle(input),
    onSuccess: (result) => {
      if ("data" in result) {
        queryClient.invalidateQueries({ queryKey: knowledgeKeys.all });
      }
    },
  });
}

/**
 * Update one article's title/content. Scoped to `articleId` so overlapping
 * saves for the SAME article (e.g. a slow autosave still in flight when the
 * next one fires) are serialized instead of racing — see {@link
 * articleScope}. A separate `ArticleEditor` instance (and its `articleId`)
 * is mounted per article, so this scoping is naturally per-article.
 */
export function useUpdateArticle(articleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    scope: articleScope(articleId),
    mutationFn: (input: UpdateArticleInput) => updateArticle(articleId, input),
    onSuccess: (result) => {
      if ("data" in result) {
        queryClient.invalidateQueries({ queryKey: knowledgeKeys.all });
      }
    },
  });
}

/** Delete an article with an optimistic removal from the list. */
export function useDeleteArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteArticle(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: knowledgeKeys.all });
      const previous = queryClient.getQueryData<KnowledgeArticle[]>(
        knowledgeKeys.all,
      );

      queryClient.setQueryData<KnowledgeArticle[]>(
        knowledgeKeys.all,
        (articles) => articles?.filter((article) => article.id !== id),
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(knowledgeKeys.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.all });
    },
  });
}
