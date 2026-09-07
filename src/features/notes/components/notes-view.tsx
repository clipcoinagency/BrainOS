"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, NotebookPen, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Note } from "@/lib/supabase/types";

import { useCreateNote, useNotesQuery } from "../hooks/use-notes";
import { DeleteNoteDialog } from "./delete-note-dialog";
import { NoteCard } from "./note-card";

export function NotesView({ initialNotes }: { initialNotes: Note[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { data: notes } = useNotesQuery(initialNotes);
  const createNote = useCreateNote();

  // The note pending delete confirmation. Owned here (not inside NoteCard) so
  // the confirmation dialog stays mounted through its own close transition
  // even though the optimistic delete removes the note — and its NoteCard —
  // from this list the instant the user confirms.
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(q) ||
        note.content.toLowerCase().includes(q),
    );
  }, [notes, query]);

  // Pinned notes first, most-recently-updated next — as ONE sorted list, not
  // two separately-mapped arrays. Keeping every card under a single parent
  // lets React match cards by key when a note's pinned state changes, so
  // toggling pin *moves* the card (preserving its DOM node and any focus on
  // it) instead of unmounting it from one section and remounting it in the
  // other.
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });
  }, [filtered]);

  const firstUnpinnedIndex = sorted.findIndex((note) => !note.is_pinned);
  const hasPinned = sorted.length > 0 && sorted[0].is_pinned;
  const hasBothSections = hasPinned && firstUnpinnedIndex > 0;

  function handleCreate() {
    createNote.mutate(undefined, {
      onSuccess: (result) => {
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        router.push(`/notes/${result.data.id}`);
      },
      onError: () => toast.error("Failed to create note."),
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notes"
        description="Capture thoughts, ideas, and long-form writing."
        actions={
          <Button onClick={handleCreate} disabled={createNote.isPending}>
            {createNote.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            New note
          </Button>
        }
      />

      {notes.length > 0 ? (
        <div className="relative max-w-sm">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search notes…"
            className="pl-8"
            aria-label="Search notes"
          />
        </div>
      ) : null}

      {notes.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="No notes yet"
          description="Create your first note to start capturing thoughts and ideas."
          action={
            <Button onClick={handleCreate} disabled={createNote.isPending}>
              {createNote.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              New note
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching notes"
          description={`Nothing matches "${query}". Try a different search.`}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((note, index) => (
            <Fragment key={note.id}>
              {hasBothSections && index === 0 ? (
                <h2 className="text-muted-foreground col-span-full text-xs font-medium tracking-wider uppercase">
                  Pinned
                </h2>
              ) : null}
              {hasBothSections && index === firstUnpinnedIndex ? (
                <h2 className="text-muted-foreground col-span-full text-xs font-medium tracking-wider uppercase">
                  All notes
                </h2>
              ) : null}
              <NoteCard note={note} onRequestDelete={setDeleteTarget} />
            </Fragment>
          ))}
        </div>
      )}

      <DeleteNoteDialog
        noteId={deleteTarget?.id ?? ""}
        noteTitle={
          deleteTarget && deleteTarget.title.trim() !== "Untitled"
            ? deleteTarget.title.trim()
            : ""
        }
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
