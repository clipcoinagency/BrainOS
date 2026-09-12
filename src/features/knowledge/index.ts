/**
 * Public surface of the knowledge feature.
 *
 * Client-safe: UI components and "use server" actions (safe to import
 * anywhere — Next.js replaces their implementation with an RPC stub in
 * client bundles). Server-only reads live in `./queries` and must be
 * imported from `@/features/knowledge/queries` in Server Components only.
 */
export { KnowledgeView } from "./components/knowledge-view";
export { ArticleEditor } from "./components/article-editor";
export {
  createArticle,
  updateArticle,
  deleteArticle,
  type KnowledgeResult,
} from "./actions";
export {
  createArticleSchema,
  updateArticleSchema,
  type CreateArticleInput,
  type UpdateArticleInput,
} from "./schemas";
