"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Meeting } from "@/lib/supabase/types";

import {
  createMeeting,
  deleteMeeting,
  listMeetingsAction,
  updateMeeting,
} from "../actions";
import type { CreateMeetingInput, UpdateMeetingInput } from "../schemas";

export const meetingKeys = {
  all: ["meetings"] as const,
};

/** One TanStack Query mutation `scope` per meeting, shared by every
 * mutation that writes to it (autosave, schedule change) — see the notes
 * feature's `use-notes.ts` for why same-entity writes need to be serialized
 * this way. */
function meetingScope(id: string) {
  return { id: `meeting-${id}` };
}

export function useMeetingsQuery(initialData: Meeting[]) {
  return useQuery({
    queryKey: meetingKeys.all,
    queryFn: () => listMeetingsAction(),
    initialData,
  });
}

/** Create a meeting. Callers typically navigate to the new meeting on
 * success. */
export function useCreateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input?: CreateMeetingInput) => createMeeting(input),
    onSuccess: (result) => {
      if ("data" in result) {
        queryClient.invalidateQueries({ queryKey: meetingKeys.all });
      }
    },
  });
}

export function useUpdateMeeting(meetingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    scope: meetingScope(meetingId),
    mutationFn: (input: UpdateMeetingInput) => updateMeeting(meetingId, input),
    onSuccess: (result) => {
      if ("data" in result) {
        queryClient.invalidateQueries({ queryKey: meetingKeys.all });
      }
    },
  });
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMeeting(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: meetingKeys.all });
      const previous = queryClient.getQueryData<Meeting[]>(meetingKeys.all);

      queryClient.setQueryData<Meeting[]>(meetingKeys.all, (meetings) =>
        meetings?.filter((meeting) => meeting.id !== id),
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(meetingKeys.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.all });
    },
  });
}
