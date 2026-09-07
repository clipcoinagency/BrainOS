"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, Pin, PinOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Note } from "@/lib/supabase/types";

import { useToggleNotePin, useUpdateNote } from "../hooks/use-notes";
import { DeleteNoteDialog } from "./delete-note-dialog";

const AUTOSAVE_DELAY_MS = 800;

export function NoteEditor({ note }: { note: Note }) {
  const router = useRouter();
  const updateNote = useUpdateNote(note.id);
  const togglePin = useToggleNotePin(note.id);

  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [isPinned, setIsPinned] = useState(note.is_pinned);
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Autosave while typing. A short debounce keeps this from firing on every
  // keystroke; the trade-off is that the last few keystrokes right before an
  // abrupt navigation could be lost. Acceptable for v1 — see roadmap. Saves
  // for this note are serialized (see the `scope` on useUpdateNote), so a
  // slow save can no longer land after a newer one and revert the content.
  const debouncedSave = useDebouncedCallback(
    (nextTitle: string, nextContent: string) => {
      updateNote.mutate(
        { title: nextTitle, content: nextContent },
        {
          onSuccess: (result) => {
            if ("error" in result) {
              toast.error(result.error);
              return;
            }
            setDirty(false);
            setLastSavedAt(new Date());
          },
          onError: () =>
            toast.error(
              "Failed to save. Your changes are kept locally — try again.",
            ),
        },
      );
    },
    AUTOSAVE_DELAY_MS,
  );

  function handleTitleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setTitle(value);
    setDirty(true);
    debouncedSave(value, content);
  }

  function handleContentChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = event.target.value;
    setContent(value);
    setDirty(true);
    debouncedSave(title, value);
  }

  function handleTogglePin() {
    const next = !isPinned;
    setIsPinned(next);
    togglePin.mutate(next, {
      onError: () => {
        setIsPinned(!next);
        toast.error("Failed to update note.");
      },
    });
  }

  const status = updateNote.isPending
    ? "Saving…"
    : dirty
      ? "Unsaved changes"
      : lastSavedAt
        ? `Saved ${formatRelativeTime(lastSavedAt)}`
        : `Saved ${formatRelativeTime(note.updated_at)}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/notes">
            <ArrowLeft className="size-4" />
            Notes
          </Link>
        </Button>

        <div className="flex items-center gap-1">
          <span className="text-muted-foreground mr-1 flex items-center gap-1 text-xs">
            {updateNote.isPending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : !dirty ? (
              <Check className="size-3" />
            ) : null}
            {status}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={isPinned ? "Unpin note" : "Pin note"}
            aria-pressed={isPinned}
            onClick={handleTogglePin}
            className={cn(isPinned && "text-brand")}
          >
            {isPinned ? (
              <Pin className="size-4" />
            ) : (
              <PinOff className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete note"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <Input
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          aria-label="Title"
          // Lands the cursor here right after "New note" navigates to this
          // page, and is a harmless, expected default when opening any note.
          autoFocus
          className="h-auto border-none bg-transparent px-0 text-2xl font-semibold shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <Textarea
          value={content}
          onChange={handleContentChange}
          placeholder="Start writing…"
          aria-label="Note content"
          className="text-foreground min-h-[60vh] resize-none border-none px-0 text-sm leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
      </div>

      <DeleteNoteDialog
        noteId={note.id}
        noteTitle={title.trim()}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.push("/notes")}
      />
    </div>
  );
}
