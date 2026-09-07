"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Note } from "@/lib/supabase/types";

import {
  createNote,
  deleteNote,
  listNotesAction,
  toggleNotePin,
  updateNote,
} from "../actions";
import type { CreateNoteInput, UpdateNoteInput } from "../schemas";

export const noteKeys = {
  all: ["notes"] as const,
};

/** One TanStack Query mutation `scope` per note, shared by every mutation that
 * writes to that note (autosave, pin toggle). Mutations sharing a scope are
 * serialized by TanStack Query — an update dispatched while an earlier one for
 * the same note is still pending waits its turn, so writes always land in the
 * order the user made them instead of racing. Without this, a slow autosave
 * can complete after a newer one and silently revert a note to older content
 * (or a rapid pin/unpin double-click can persist the wrong final state). */
function noteScope(id: string) {
  return { id: `note-${id}` };
}

/**
 * The notes list, seeded with server-fetched `initialData` so there is no
 * loading flash on first paint. Subsequent refetches (after mutations) go
 * through `listNotesAction`, a "use server" bridge to the server-only query.
 */
export function useNotesQuery(initialData: Note[]) {
  return useQuery({
    queryKey: noteKeys.all,
    queryFn: () => listNotesAction(),
    initialData,
  });
}

/** Create a note. Callers typically navigate to the new note on success. */
export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input?: CreateNoteInput) => createNote(input),
    onSuccess: (result) => {
      if ("data" in result) {
        queryClient.invalidateQueries({ queryKey: noteKeys.all });
      }
    },
  });
}

/**
 * Update one note's title/content/pinned state. Scoped to `noteId` so
 * overlapping saves for the SAME note (e.g. a slow autosave still in flight
 * when the next one fires) are serialized instead of racing — see
 * {@link noteScope}. A separate `NoteEditor` instance (and its `noteId`) is
 * mounted per note, so this scoping is naturally per-note.
 */
export function useUpdateNote(noteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    scope: noteScope(noteId),
    mutationFn: (input: UpdateNoteInput) => updateNote(noteId, input),
    onSuccess: (result) => {
      if ("data" in result) {
        queryClient.invalidateQueries({ queryKey: noteKeys.all });
      }
    },
  });
}

/**
 * Toggle pin with an optimistic update to the list so the UI feels instant.
 * Shares its scope with {@link useUpdateNote} for the same note, so a pin
 * toggle and an in-flight autosave (or two rapid pin toggles) are serialized.
 */
export function useToggleNotePin(noteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    scope: noteScope(noteId),
    mutationFn: (isPinned: boolean) => toggleNotePin(noteId, isPinned),
    onMutate: async (isPinned) => {
      await queryClient.cancelQueries({ queryKey: noteKeys.all });
      const previous = queryClient.getQueryData<Note[]>(noteKeys.all);

      queryClient.setQueryData<Note[]>(noteKeys.all, (notes) =>
        notes
          ?.map((note) =>
            note.id === noteId ? { ...note, is_pinned: isPinned } : note,
          )
          .sort((a, b) => {
            if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
            return (
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime()
            );
          }),
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(noteKeys.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
    },
  });
}

/** Delete a note with an optimistic removal from the list. */
export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: noteKeys.all });
      const previous = queryClient.getQueryData<Note[]>(noteKeys.all);

      queryClient.setQueryData<Note[]>(noteKeys.all, (notes) =>
        notes?.filter((note) => note.id !== id),
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(noteKeys.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
    },
  });
}
