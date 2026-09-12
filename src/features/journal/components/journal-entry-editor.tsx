"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import type { JournalEntry, JournalMood } from "@/lib/supabase/types";

import { useUpdateJournalEntry } from "../hooks/use-journal";
import { formatEntryDate } from "../lib/date";
import {
  MOODS,
  MOOD_COLOR_CLASSNAME,
  MOOD_ICON,
  MOOD_LABEL,
} from "../lib/mood";
import { DeleteJournalEntryDialog } from "./delete-journal-entry-dialog";

const AUTOSAVE_DELAY_MS = 800;

/**
 * The journal entry page: a fixed, non-editable date heading, a mood picker
 * (saves immediately, like Projects' status Select), and a content textarea
 * (debounced autosave, like the note editor). Both go through the SAME
 * `useUpdateJournalEntry` instance, so they share one mutation scope and
 * can't race each other — see the notes/projects features for the review
 * finding this pattern fixes. Every success path updates `lastSavedAt`, not
 * just the debounced one, so the "Saved…" indicator never goes stale after a
 * mood-only change (a lesson from the Projects review, applied here from the
 * start).
 */
export function JournalEntryEditor({ entry }: { entry: JournalEntry }) {
  const router = useRouter();
  const updateEntry = useUpdateJournalEntry(entry.id);

  const [content, setContent] = useState(entry.content);
  // Local + optimistic, not bound to `entry.mood` directly: the `entry` prop
  // comes from the Server Component page and only refreshes on a full
  // navigation, so a mood button bound straight to it would keep showing the
  // pre-change value even after the mutation succeeds.
  const [mood, setMood] = useState<JournalMood | null>(entry.mood);
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const debouncedSave = useDebouncedCallback((nextContent: string) => {
    updateEntry.mutate(
      { content: nextContent },
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
  }, AUTOSAVE_DELAY_MS);

  function handleContentChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = event.target.value;
    setContent(value);
    setDirty(true);
    debouncedSave(value);
  }

  function handleMoodChange(next: JournalMood) {
    const previous = mood;
    const value = next === mood ? null : next;
    setMood(value);
    updateEntry.mutate(
      { mood: value },
      {
        onSuccess: (result) => {
          if ("error" in result) {
            setMood(previous);
            toast.error(result.error);
            return;
          }
          setLastSavedAt(new Date());
        },
        onError: () => {
          setMood(previous);
          toast.error("Failed to update entry.");
        },
      },
    );
  }

  const status = updateEntry.isPending
    ? "Saving…"
    : dirty
      ? "Unsaved changes"
      : lastSavedAt
        ? `Saved ${formatRelativeTime(lastSavedAt)}`
        : `Saved ${formatRelativeTime(entry.updated_at)}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/journal">
            <ArrowLeft className="size-4" />
            Journal
          </Link>
        </Button>

        <div className="flex items-center gap-1">
          <span
            aria-live="polite"
            className="text-muted-foreground mr-1 flex items-center gap-1 text-xs"
          >
            {updateEntry.isPending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : !dirty ? (
              <Check className="size-3" />
            ) : null}
            {status}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete entry"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">
          {formatEntryDate(entry.entry_date)}
        </h1>
      </div>

      <div
        role="radiogroup"
        aria-label="Mood"
        className="flex items-center gap-1.5"
      >
        {MOODS.map((value) => {
          const Icon = MOOD_ICON[value];
          const selected = mood === value;
          return (
            <Button
              key={value}
              type="button"
              variant="ghost"
              size="icon"
              role="radio"
              aria-checked={selected}
              aria-label={MOOD_LABEL[value]}
              onClick={() => handleMoodChange(value)}
              className={cn(
                "border",
                selected
                  ? cn("bg-muted border-current", MOOD_COLOR_CLASSNAME[value])
                  : "text-muted-foreground border-transparent",
              )}
            >
              <Icon className="size-4" />
            </Button>
          );
        })}
      </div>

      <Textarea
        value={content}
        onChange={handleContentChange}
        placeholder="How did today go?"
        aria-label="Entry content"
        // Lands the cursor here right after "New entry" navigates to this
        // page, and is a harmless, expected default when opening any entry.
        autoFocus
        className="text-foreground min-h-[55vh] resize-none border-none px-0 text-sm leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
      />

      <DeleteJournalEntryDialog
        entryId={entry.id}
        entryDateLabel={formatEntryDate(entry.entry_date)}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.push("/journal")}
      />
    </div>
  );
}
