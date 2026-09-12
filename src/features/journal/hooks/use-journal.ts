"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { JournalEntry } from "@/lib/supabase/types";

import {
  createJournalEntry,
  deleteJournalEntry,
  listJournalEntriesAction,
  updateJournalEntry,
} from "../actions";
import type {
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
} from "../schemas";

export const journalKeys = {
  all: ["journal-entries"] as const,
};

/** One TanStack Query mutation `scope` per entry, shared by every mutation
 * that writes to that entry (autosave, mood change) — see `use-notes.ts` for
 * why same-entity writes need to be serialized this way. */
function journalEntryScope(id: string) {
  return { id: `journal-entry-${id}` };
}

/**
 * The journal entries list, seeded with server-fetched `initialData` so
 * there is no loading flash on first paint. Subsequent refetches (after
 * mutations) go through `listJournalEntriesAction`, a "use server" bridge to
 * the server-only query.
 */
export function useJournalEntriesQuery(initialData: JournalEntry[]) {
  return useQuery({
    queryKey: journalKeys.all,
    queryFn: () => listJournalEntriesAction(),
    initialData,
  });
}

/** Create (or, for a day that already has one, fetch) a journal entry.
 * Callers typically navigate to the returned entry on success. */
export function useCreateJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input?: CreateJournalEntryInput) => createJournalEntry(input),
    onSuccess: (result) => {
      if ("data" in result) {
        queryClient.invalidateQueries({ queryKey: journalKeys.all });
      }
    },
  });
}

/**
 * Update one entry's mood/content. Scoped to `entryId` so overlapping saves
 * for the SAME entry (e.g. a slow autosave still in flight when the next one
 * fires) are serialized instead of racing — see {@link journalEntryScope}. A
 * separate `JournalEntryEditor` instance (and its `entryId`) is mounted per
 * entry, so this scoping is naturally per-entry.
 */
export function useUpdateJournalEntry(entryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    scope: journalEntryScope(entryId),
    mutationFn: (input: UpdateJournalEntryInput) =>
      updateJournalEntry(entryId, input),
    onSuccess: (result) => {
      if ("data" in result) {
        queryClient.invalidateQueries({ queryKey: journalKeys.all });
      }
    },
  });
}

/** Delete a journal entry with an optimistic removal from the list. */
export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteJournalEntry(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: journalKeys.all });
      const previous = queryClient.getQueryData<JournalEntry[]>(
        journalKeys.all,
      );

      queryClient.setQueryData<JournalEntry[]>(journalKeys.all, (entries) =>
        entries?.filter((entry) => entry.id !== id),
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(journalKeys.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: journalKeys.all });
    },
  });
}
