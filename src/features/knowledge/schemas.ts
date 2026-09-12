import { z } from "zod";

/** Fields accepted when creating an article. Everything is optional — a
 * blank article ("Untitled") is a valid starting point, matching Notes. */
export const createArticleSchema = z.object({
  title: z.string().max(200, "Title is too long.").optional(),
  content: z.string().max(100_000, "Article is too long.").optional(),
});

/** Fields accepted when updating an article. All optional; only provided
 * fields change. */
export const updateArticleSchema = z.object({
  title: z.string().max(200, "Title is too long.").optional(),
  content: z.string().max(100_000, "Article is too long.").optional(),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
