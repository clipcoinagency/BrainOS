"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { requireUser } from "@/lib/supabase/require-user";
import type { KnowledgeArticle } from "@/lib/supabase/types";

import { createArticleSchema, updateArticleSchema } from "./schemas";
import type { CreateArticleInput, UpdateArticleInput } from "./schemas";
import { getArticle, listArticles } from "./queries";

/** Discriminated result returned to the client. */
export type KnowledgeResult<T> = { data: T } | { error: string };

const NOT_FOUND = "Article not found.";

// `id` always originates from a route param or another action's own return
// value, but these are Server Actions — reachable by any authenticated
// browser via devtools or a hand-crafted request, not just through our UI.
const articleIdSchema = z.string().uuid();

function revalidateKnowledge(id?: string) {
  revalidatePath("/knowledge");
  if (id) revalidatePath(`/knowledge/${id}`);
}

/**
 * List the current user's articles. A "use server" bridge over
 * `queries.listArticles` so Client Components (e.g. a TanStack Query
 * `queryFn`) can call it — direct imports of `queries.ts` are blocked by its
 * `server-only` guard.
 */
export async function listArticlesAction(): Promise<KnowledgeArticle[]> {
  return listArticles();
}

/** Get one article by id. See {@link listArticlesAction} for why this
 * bridges `queries.ts`. */
export async function getArticleAction(
  id: string,
): Promise<KnowledgeArticle | null> {
  if (!articleIdSchema.safeParse(id).success) return null;
  return getArticle(id);
}

/** Create an article (blank by default) and return it. */
export async function createArticle(
  input: CreateArticleInput = {},
): Promise<KnowledgeResult<KnowledgeArticle>> {
  const ctx = await requireUser("Knowledge articles");
  if ("error" in ctx) return { error: ctx.error };

  const parsed = createArticleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the article and try again." };
  }

  const { supabase, user } = ctx;
  const { data, error } = await supabase
    .from("knowledge_articles")
    .insert({
      user_id: user.id,
      title: parsed.data.title ?? "",
      content: parsed.data.content ?? "",
    })
    .select()
    .single();

  if (error || !data) return { error: "Failed to create article." };

  revalidateKnowledge();
  return { data };
}

/** Update an article's title and/or content. */
export async function updateArticle(
  id: string,
  input: UpdateArticleInput,
): Promise<KnowledgeResult<KnowledgeArticle>> {
  if (!articleIdSchema.safeParse(id).success) return { error: NOT_FOUND };

  const ctx = await requireUser("Knowledge articles");
  if ("error" in ctx) return { error: ctx.error };

  const parsed = updateArticleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the article and try again." };
  }

  const { title, content } = parsed.data;
  if (title === undefined && content === undefined) {
    return { error: "Nothing to update." };
  }

  const { supabase, user } = ctx;
  const { data, error } = await supabase
    .from("knowledge_articles")
    .update({
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  // No matching row (wrong owner, or deleted between click and request) and a
  // genuine database error both land here — .single() errors either way, and
  // callers only need to know the update didn't happen.
  if (error || !data) return { error: "Failed to update article." };

  revalidateKnowledge(id);
  return { data };
}

/** Delete an article. */
export async function deleteArticle(
  id: string,
): Promise<KnowledgeResult<{ id: string }>> {
  if (!articleIdSchema.safeParse(id).success) return { error: NOT_FOUND };

  const ctx = await requireUser("Knowledge articles");
  if ("error" in ctx) return { error: ctx.error };

  const { supabase, user } = ctx;
  const { error } = await supabase
    .from("knowledge_articles")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "Failed to delete article." };

  revalidateKnowledge(id);
  return { data: { id } };
}
