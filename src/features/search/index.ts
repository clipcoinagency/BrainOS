/**
 * Public surface of the search feature.
 *
 * Client-safe: the "use server" action and the hook that wraps it.
 */
export { searchWorkspace } from "./actions";
export { useSearchWorkspace } from "./hooks/use-search";
export type { SearchResult, SearchResultType } from "./types";
