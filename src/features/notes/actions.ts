"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { requireUser } from "@/lib/supabase/require-user";
import type { Note } from "@/lib/supabase/types";

import { createNoteSchema, updateNoteSchema } from "./schemas";
import type { CreateNoteInput, UpdateNoteInput } from "./schemas";
import { getNote, listNotes } from "./queries";

/** Discriminated result returned to the client. */
export type NoteResult<T> = { data: T } | { error: string };

const NOT_FOUND = "Note not found.";

// `id` always originates from a route param or another action's own return
// value, but these are Server Actions — reachable by any authenticated
// browser via devtools or a hand-crafted request, not just through our UI.
// Validating the shape here turns a malformed id into our own generic
// message instead of a raw Postgres type-cast error surfacing to the client.
const noteIdSchema = z.string().uuid();

function revalidateNotes(id?: string) {
  revalidatePath("/notes");
  if (id) revalidatePath(`/notes/${id}`);
}

/**
 * List the current user's notes. A "use server" bridge over `queries.listNotes`
 * so Client Components (e.g. a TanStack Query `queryFn`) can call it — direct
 * imports of `queries.ts` are blocked by its `server-only` guard.
 */
export async function listNotesAction(): Promise<Note[]> {
  return listNotes();
}

/** Get one note by id. See {@link listNotesAction} for why this bridges `queries.ts`. */
export async function getNoteAction(id: string): Promise<Note | null> {
  if (!noteIdSchema.safeParse(id).success) return null;
  return getNote(id);
}

/** Create a note (blank by default) and return it. */
export async function createNote(
  input: CreateNoteInput = {},
): Promise<NoteResult<Note>> {
  const ctx = await requireUser("Notes");
  if ("error" in ctx) return { error: ctx.error };

  const parsed = createNoteSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the note and try again." };

  const { supabase, user } = ctx;
  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: user.id,
      title: parsed.data.title ?? "",
      content: parsed.data.content ?? "",
    })
    .select()
    .single();

  if (error || !data) return { error: "Failed to create note." };

  revalidateNotes();
  return { data };
}

/** Update a note's title, content, and/or pinned state. */
export async function updateNote(
  id: string,
  input: UpdateNoteInput,
): Promise<NoteResult<Note>> {
  if (!noteIdSchema.safeParse(id).success) return { error: NOT_FOUND };

  const ctx = await requireUser("Notes");
  if ("error" in ctx) return { error: ctx.error };

  const parsed = updateNoteSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the note and try again." };

  const { title, content, isPinned } = parsed.data;
  if (title === undefined && content === undefined && isPinned === undefined) {
    return { error: "Nothing to update." };
  }

  const { supabase, user } = ctx;
  const { data, error } = await supabase
    .from("notes")
    .update({
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(isPinned !== undefined && { is_pinned: isPinned }),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  // No matching row (wrong owner, or deleted between click and request) and a
  // genuine database error both land here — .single() errors either way, and
  // callers only need to know the update didn't happen.
  if (error || !data) return { error: "Failed to update note." };

  revalidateNotes(id);
  return { data };
}

/** Toggle a note's pinned state. Thin wrapper over {@link updateNote}. */
export async function toggleNotePin(
  id: string,
  isPinned: boolean,
): Promise<NoteResult<Note>> {
  return updateNote(id, { isPinned });
}

/** Delete a note. */
export async function deleteNote(
  id: string,
): Promise<NoteResult<{ id: string }>> {
  if (!noteIdSchema.safeParse(id).success) return { error: NOT_FOUND };

  const ctx = await requireUser("Notes");
  if ("error" in ctx) return { error: ctx.error };

  const { supabase, user } = ctx;
  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "Failed to delete note." };

  revalidateNotes(id);
  return { data: { id } };
}
