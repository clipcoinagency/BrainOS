/**
 * Public surface of the search feature.
 *
 * Client-safe: the "use server" action and the hook that wraps it.
 */
export { searchWorkspace } from "./actions";
export { useSearchWorkspace, searchKeys } from "./hooks/use-search";
export { MIN_SEARCH_QUERY_LENGTH } from "./schemas";
export type { SearchResult, SearchResultType } from "./types";
