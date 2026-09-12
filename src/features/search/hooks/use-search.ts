"use client";

import { useQuery } from "@tanstack/react-query";

import { searchWorkspace } from "../actions";

/**
 * Search across modules for the command palette. Disabled below 2
 * characters (see `searchQuerySchema`) so it doesn't fire on the first
 * keystroke; `staleTime: 0` since a workspace search should always reflect
 * the latest data, not a cached answer to an earlier query.
 */
export function useSearchWorkspace(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: ["search", trimmed],
    queryFn: () => searchWorkspace(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 0,
  });
}
