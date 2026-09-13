"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { formatRelativeTime } from "@/lib/format";
import type { Meeting } from "@/lib/supabase/types";

import { useUpdateMeeting } from "../hooks/use-meetings";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "../lib/schedule";
import { DeleteMeetingDialog } from "./delete-meeting-dialog";

const AUTOSAVE_DELAY_MS = 800;

/**
 * The meeting detail page: title/attendees/notes autosave (debounced, like
 * the notes editor), scheduled time saves immediately on change since it's
 * a single discrete pick, not typed character-by-character. All four go
 * through the SAME `useUpdateMeeting` instance, so they share one mutation
 * scope and can't race each other (see the notes/projects/journal features
 * for the review finding this pattern fixes).
 */
export function MeetingEditor({ meeting }: { meeting: Meeting }) {
  const router = useRouter();
  const updateMeeting = useUpdateMeeting(meeting.id);

  const [title, setTitle] = useState(meeting.title);
  const [attendees, setAttendees] = useState(meeting.attendees);
  const [notes, setNotes] = useState(meeting.notes);
  // Local + optimistic, not bound to `meeting.scheduled_at` directly: the
  // `meeting` prop comes from the Server Component page and only refreshes
  // on a full page reload, so an <input> bound straight to it would keep
  // showing the pre-change value even after the mutation succeeds.
  const [scheduledAtLocal, setScheduledAtLocal] = useState(
    toDatetimeLocalValue(meeting.scheduled_at),
  );
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const debouncedSave = useDebouncedCallback(
    (nextTitle: string, nextAttendees: string, nextNotes: string) => {
      updateMeeting.mutate(
        { title: nextTitle, attendees: nextAttendees, notes: nextNotes },
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
    debouncedSave(value, attendees, notes);
  }

  function handleAttendeesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setAttendees(value);
    setDirty(true);
    debouncedSave(title, value, notes);
  }

  function handleNotesChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = event.target.value;
    setNotes(value);
    setDirty(true);
    debouncedSave(title, attendees, value);
  }

  function handleScheduledAtChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    const previous = scheduledAtLocal;
    setScheduledAtLocal(value);
    updateMeeting.mutate(
      { scheduledAt: fromDatetimeLocalValue(value) },
      {
        onSuccess: (result) => {
          if ("error" in result) {
            setScheduledAtLocal(previous);
            toast.error(result.error);
            return;
          }
          // Every successful save through this `updateMeeting` instance
          // updates the same "last saved" bookkeeping — otherwise the
          // indicator falls back to `meeting.updated_at`, which is the
          // stale value from page load, not this save.
          setLastSavedAt(new Date());
        },
        onError: () => {
          setScheduledAtLocal(previous);
          toast.error("Failed to update meeting.");
        },
      },
    );
  }

  const status = updateMeeting.isPending
    ? "Saving…"
    : dirty
      ? "Unsaved changes"
      : lastSavedAt
        ? `Saved ${formatRelativeTime(lastSavedAt)}`
        : `Saved ${formatRelativeTime(meeting.updated_at)}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/meetings">
            <ArrowLeft className="size-4" />
            Meetings
          </Link>
        </Button>

        <div className="flex items-center gap-1">
          <span
            aria-live="polite"
            className="text-muted-foreground mr-1 flex items-center gap-1 text-xs"
          >
            {updateMeeting.isPending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : !dirty ? (
              <Check className="size-3" />
            ) : null}
            {status}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete meeting"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <Input
        value={title}
        onChange={handleTitleChange}
        placeholder="Untitled"
        aria-label="Title"
        autoFocus
        className="h-auto border-none bg-transparent px-0 text-2xl font-semibold shadow-none focus-visible:ring-0 dark:bg-transparent"
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="meeting-scheduled-at">Scheduled for</Label>
          <Input
            id="meeting-scheduled-at"
            type="datetime-local"
            value={scheduledAtLocal}
            onChange={handleScheduledAtChange}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="meeting-attendees">Attendees</Label>
          <Input
            id="meeting-attendees"
            value={attendees}
            onChange={handleAttendeesChange}
            placeholder="Comma-separated names"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="meeting-notes">Agenda &amp; notes</Label>
        <Textarea
          id="meeting-notes"
          value={notes}
          onChange={handleNotesChange}
          placeholder="Agenda, discussion notes, follow-ups…"
          className="min-h-[40vh] resize-none text-sm leading-relaxed"
        />
      </div>

      <DeleteMeetingDialog
        meetingId={meeting.id}
        meetingTitle={title.trim()}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.push("/meetings")}
      />
    </div>
  );
}
