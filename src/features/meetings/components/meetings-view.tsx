"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Search, Video } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Meeting } from "@/lib/supabase/types";

import { useCreateMeeting, useMeetingsQuery } from "../hooks/use-meetings";
import { DeleteMeetingDialog } from "./delete-meeting-dialog";
import { MeetingCard } from "./meeting-card";

export function MeetingsView({
  initialMeetings,
}: {
  initialMeetings: Meeting[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { data: meetings } = useMeetingsQuery(initialMeetings);
  const createMeeting = useCreateMeeting();

  // The meeting pending delete confirmation. Owned here (not inside
  // MeetingCard) so the confirmation dialog stays mounted through its own
  // close transition even though the optimistic delete removes the meeting
  // — and its card — from this list the instant the user confirms.
  const [deleteTarget, setDeleteTarget] = useState<Meeting | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return meetings;
    return meetings.filter(
      (meeting) =>
        meeting.title.toLowerCase().includes(q) ||
        meeting.attendees.toLowerCase().includes(q),
    );
  }, [meetings, query]);

  function handleCreate() {
    createMeeting.mutate(undefined, {
      onSuccess: (result) => {
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        router.push(`/meetings/${result.data.id}`);
      },
      onError: () => toast.error("Failed to create meeting."),
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meetings"
        description="Notes, agendas, and follow-ups for meetings."
        actions={
          <Button onClick={handleCreate} disabled={createMeeting.isPending}>
            {createMeeting.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            New meeting
          </Button>
        }
      />

      {meetings.length > 0 ? (
        <div className="relative max-w-sm">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search meetings…"
            className="pl-8"
            aria-label="Search meetings"
          />
        </div>
      ) : null}

      {meetings.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No meetings yet"
          description="Create your first meeting to start tracking agendas and notes."
          action={
            <Button onClick={handleCreate} disabled={createMeeting.isPending}>
              {createMeeting.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              New meeting
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching meetings"
          description={`Nothing matches "${query}". Try a different search.`}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              onRequestDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <DeleteMeetingDialog
        meetingId={deleteTarget?.id ?? ""}
        meetingTitle={
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
