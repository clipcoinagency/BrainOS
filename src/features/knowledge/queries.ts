import "server-only";

import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { KnowledgeArticle } from "@/lib/supabase/types";

import { wikiLinkPattern } from "./lib/wiki-links";

/**
 * List the current user's knowledge articles, most recently updated first.
 *
 * Returns an empty array (never throws) when Supabase is not configured or
 * the user is unauthenticated, so callers can render a normal empty state.
 *
 * Wrapped in React's `cache()` so multiple calls within one request (e.g. a
 * page and its `generateMetadata`) share a single fetch.
 */
export const listArticles = cache(async (): Promise<KnowledgeArticle[]> => {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("knowledge_articles")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) return [];
    return data;
  } catch {
    return [];
  }
});

/**
 * Get one article by id, scoped to the current user.
 *
 * Returns `null` if the article doesn't exist, belongs to someone else (RLS
 * already prevents the row from being returned), Supabase is unconfigured,
 * or the request fails.
 *
 * Wrapped in React's `cache()` — see {@link listArticles}.
 */
export const getArticle = cache(
  async (id: string): Promise<KnowledgeArticle | null> => {
    if (!isSupabaseConfigured) return null;

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("knowledge_articles")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      return data;
    } catch {
      return null;
    }
  },
);

/**
 * List every OTHER article (owned by the same user) whose content contains a
 * `[[title]]` reference to the given article — its "backlinks". A link is
 * purely a title-text match inside `content`, computed at read time; there
 * is no separate links table (see the migration's comment for why).
 */
export const listBacklinks = cache(
  async (
    articleId: string,
    title: string,
  ): Promise<Pick<KnowledgeArticle, "id" | "title" | "updated_at">[]> => {
    if (!isSupabaseConfigured || !title.trim()) return [];

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("knowledge_articles")
        .select("id, title, updated_at")
        .eq("user_id", user.id)
        .neq("id", articleId)
        .ilike("content", wikiLinkPattern(title))
        .order("updated_at", { ascending: false });

      if (error) return [];
      return data;
    } catch {
      return [];
    }
  },
);
