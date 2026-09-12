"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { JournalEntry } from "@/lib/supabase/types";

import { formatEntryDateShort } from "../lib/date";
import { MOOD_COLOR_CLASSNAME, MOOD_ICON, MOOD_LABEL } from "../lib/mood";

interface JournalEntryCardProps {
  entry: JournalEntry;
  /** Ask the parent to open the delete-confirmation flow for this entry. The
   * dialog itself lives in `JournalView`, not here — an optimistic delete
   * removes this card (and anything mounted inside it, including an open
   * dialog) the instant it's confirmed. */
  onRequestDelete: (entry: JournalEntry) => void;
}

export function JournalEntryCard({
  entry,
  onRequestDelete,
}: JournalEntryCardProps) {
  const preview = entry.content.trim();
  const MoodIcon = entry.mood ? MOOD_ICON[entry.mood] : null;

  return (
    <Link
      href={`/journal/${entry.id}`}
      className="group bg-card hover:border-brand/40 focus-visible:ring-ring relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all hover:shadow-sm focus-visible:ring-2 focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-1 text-sm font-medium">
          {formatEntryDateShort(entry.entry_date)}
        </h3>

        <div className="-mt-1 -mr-1 flex items-center gap-0.5">
          {MoodIcon ? (
            <span
              className={`flex size-7 items-center justify-center ${MOOD_COLOR_CLASSNAME[entry.mood!]}`}
              aria-label={`Mood: ${MOOD_LABEL[entry.mood!]}`}
              title={MOOD_LABEL[entry.mood!]}
            >
              <MoodIcon className="size-4" aria-hidden="true" />
            </span>
          ) : null}
          {/* Stops the click from triggering the card's Link navigation.
              Visible on hover or when keyboard focus lands on it
              (group-focus-within) so a keyboard user tabbing here sees it. */}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete entry for ${formatEntryDateShort(entry.entry_date)}`}
            onClick={(event) => {
              event.preventDefault();
              onRequestDelete(entry);
            }}
            className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {preview ? (
        <p className="text-muted-foreground line-clamp-3 text-xs text-pretty whitespace-pre-line">
          {preview}
        </p>
      ) : (
        <p className="text-muted-foreground/60 text-xs italic">No content</p>
      )}
    </Link>
  );
}
