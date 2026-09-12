"use client";

import { useQuery } from "@tanstack/react-query";

import { searchWorkspace } from "../actions";
import { MIN_SEARCH_QUERY_LENGTH } from "../schemas";

export const searchKeys = {
  all: (query: string) => ["search", query] as const,
};

/**
 * Search across modules for the command palette. Disabled below
 * `MIN_SEARCH_QUERY_LENGTH` characters so it doesn't fire on the first
 * keystroke; `staleTime: 0` since a workspace search should always reflect
 * the latest data, not a cached answer to an earlier query.
 *
 * `placeholderData: (previous) => previous` keeps the LAST resolved result
 * set on screen while a new query is in flight, instead of resetting to
 * `undefined`/`isFetching: true` on every keystroke — without it, the
 * command palette's Results group unmounts every result item on each
 * keystroke, which (per cmdk's own reselection behavior) can silently kick
 * the user's keyboard selection back to the top of the whole palette.
 *
 * Callers are expected to pass an already-debounced `query` — this hook
 * itself does not debounce, so it fires immediately whenever `query`
 * changes (see `command-menu.tsx`'s `useDebouncedCallback` usage).
 */
export function useSearchWorkspace(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: searchKeys.all(trimmed),
    queryFn: () => searchWorkspace(trimmed),
    enabled: trimmed.length >= MIN_SEARCH_QUERY_LENGTH,
    staleTime: 0,
    placeholderData: (previous) => previous,
  });
}
