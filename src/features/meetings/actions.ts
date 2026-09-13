"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { requireUser } from "@/lib/supabase/require-user";
import type { Meeting } from "@/lib/supabase/types";

import { createMeetingSchema, updateMeetingSchema } from "./schemas";
import type { CreateMeetingInput, UpdateMeetingInput } from "./schemas";
import { getMeeting, listMeetings } from "./queries";

/** Discriminated result returned to the client. */
export type MeetingResult<T> = { data: T } | { error: string };

const NOT_FOUND = "Meeting not found.";

// `id` always originates from a route param or another action's own return
// value, but these are Server Actions — reachable by any authenticated
// browser via devtools or a hand-crafted request, not just through our UI.
const meetingIdSchema = z.string().uuid();

function revalidateMeetings(id?: string) {
  revalidatePath("/meetings");
  if (id) revalidatePath(`/meetings/${id}`);
}

/** List the current user's meetings. A "use server" bridge over
 * `queries.listMeetings` so Client Components (e.g. a TanStack Query
 * `queryFn`) can call it — direct imports of `queries.ts` are blocked by its
 * `server-only` guard. */
export async function listMeetingsAction(): Promise<Meeting[]> {
  return listMeetings();
}

/** Get one meeting by id. See {@link listMeetingsAction} for why this
 * bridges `queries.ts`. */
export async function getMeetingAction(id: string): Promise<Meeting | null> {
  if (!meetingIdSchema.safeParse(id).success) return null;
  return getMeeting(id);
}

/** Create a meeting (blank by default) and return it. */
export async function createMeeting(
  input: CreateMeetingInput = {},
): Promise<MeetingResult<Meeting>> {
  const ctx = await requireUser("Meetings");
  if ("error" in ctx) return { error: ctx.error };

  const parsed = createMeetingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the meeting and try again." };
  }

  const { supabase, user } = ctx;
  const { data, error } = await supabase
    .from("meetings")
    .insert({ user_id: user.id, title: parsed.data.title ?? "" })
    .select()
    .single();

  if (error || !data) return { error: "Failed to create meeting." };

  revalidateMeetings();
  return { data };
}

/** Update a meeting's fields. */
export async function updateMeeting(
  id: string,
  input: UpdateMeetingInput,
): Promise<MeetingResult<Meeting>> {
  if (!meetingIdSchema.safeParse(id).success) return { error: NOT_FOUND };

  const ctx = await requireUser("Meetings");
  if ("error" in ctx) return { error: ctx.error };

  const parsed = updateMeetingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the meeting and try again." };
  }

  const { title, scheduledAt, attendees, notes } = parsed.data;
  if (
    title === undefined &&
    scheduledAt === undefined &&
    attendees === undefined &&
    notes === undefined
  ) {
    return { error: "Nothing to update." };
  }

  const { supabase, user } = ctx;
  const { data, error } = await supabase
    .from("meetings")
    .update({
      ...(title !== undefined && { title }),
      ...(scheduledAt !== undefined && { scheduled_at: scheduledAt }),
      ...(attendees !== undefined && { attendees }),
      ...(notes !== undefined && { notes }),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !data) return { error: "Failed to update meeting." };

  revalidateMeetings(id);
  return { data };
}

/** Delete a meeting. */
export async function deleteMeeting(
  id: string,
): Promise<MeetingResult<{ id: string }>> {
  if (!meetingIdSchema.safeParse(id).success) return { error: NOT_FOUND };

  const ctx = await requireUser("Meetings");
  if ("error" in ctx) return { error: ctx.error };

  const { supabase, user } = ctx;
  const { error } = await supabase
    .from("meetings")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "Failed to delete meeting." };

  revalidateMeetings(id);
  return { data: { id } };
}
