"use client";

import Link from "next/link";
import { MoreHorizontal, Trash2, Users } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { Meeting } from "@/lib/supabase/types";

import { formatMeetingDateTime } from "../lib/schedule";

interface MeetingCardProps {
  meeting: Meeting;
  /** Ask the parent to open the delete-confirmation flow for this meeting.
   * The dialog itself lives in `MeetingsView`, not here — an optimistic
   * delete removes the card the instant it's confirmed. */
  onRequestDelete: (meeting: Meeting) => void;
}

export function MeetingCard({ meeting, onRequestDelete }: MeetingCardProps) {
  const title = meeting.title.trim() || "Untitled";

  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="group bg-card hover:border-brand/40 focus-visible:ring-ring relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all hover:shadow-sm focus-visible:ring-2 focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-1 text-sm font-medium">{title}</h3>

        <div
          className="-mt-1 -mr-1 flex items-center gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 has-data-[state=open]:opacity-100"
          onClick={(event) => event.preventDefault()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Meeting actions"
              >
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => onRequestDelete(meeting)}
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        {formatMeetingDateTime(meeting.scheduled_at)}
      </p>

      {meeting.attendees.trim() ? (
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Users className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{meeting.attendees.trim()}</span>
        </p>
      ) : null}
    </Link>
  );
}
