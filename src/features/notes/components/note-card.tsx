"use client";

import Link from "next/link";
import { MoreHorizontal, Pin, PinOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Note } from "@/lib/supabase/types";

import { useToggleNotePin } from "../hooks/use-notes";

interface NoteCardProps {
  note: Note;
  /** Ask the parent to open the delete-confirmation flow for this note. The
   * dialog itself lives in `NotesView`, not here — see that file for why. */
  onRequestDelete: (note: Note) => void;
}

export function NoteCard({ note, onRequestDelete }: NoteCardProps) {
  const togglePin = useToggleNotePin(note.id);

  const title = note.title.trim() || "Untitled";
  const preview = note.content.trim();

  function handleTogglePin() {
    togglePin.mutate(!note.is_pinned, {
      onSuccess: (result) => {
        if ("error" in result) toast.error(result.error);
      },
      onError: () => toast.error("Failed to update note."),
    });
  }

  return (
    <Link
      href={`/notes/${note.id}`}
      className="group bg-card hover:border-brand/40 focus-visible:ring-ring relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all hover:shadow-sm focus-visible:ring-2 focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-1 text-sm font-medium">{title}</h3>

        {/* Stop these controls from triggering the card's Link navigation.
            Visible on hover, when the dropdown is open, OR when keyboard
            focus lands on either control (group-focus-within) — otherwise a
            keyboard user tabbing here would see nothing to focus on. */}
        <div
          className="-mt-1 -mr-1 flex items-center gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 has-data-[state=open]:opacity-100"
          onClick={(event) => event.preventDefault()}
        >
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={note.is_pinned ? "Unpin note" : "Pin note"}
            aria-pressed={note.is_pinned}
            onClick={handleTogglePin}
            className={cn(note.is_pinned && "text-brand")}
          >
            {note.is_pinned ? (
              <Pin className="size-3.5" />
            ) : (
              <PinOff className="size-3.5" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Note actions">
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={handleTogglePin}>
                {note.is_pinned ? (
                  <PinOff className="size-4" />
                ) : (
                  <Pin className="size-4" />
                )}
                {note.is_pinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => onRequestDelete(note)}
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {preview ? (
        <p className="text-muted-foreground line-clamp-3 text-xs text-pretty whitespace-pre-line">
          {preview}
        </p>
      ) : (
        <p className="text-muted-foreground/60 text-xs italic">No content</p>
      )}

      <p className="text-muted-foreground/60 mt-auto pt-1 text-[11px]">
        {formatRelativeTime(note.updated_at)}
      </p>
    </Link>
  );
}
