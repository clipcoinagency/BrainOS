import "server-only";

import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Meeting } from "@/lib/supabase/types";

/**
 * List the current user's meetings, soonest-scheduled first (meetings with
 * no scheduled time sort last).
 *
 * Returns an empty array (never throws) when Supabase is not configured or
 * the user is unauthenticated.
 */
export const listMeetings = cache(async (): Promise<Meeting[]> => {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .eq("user_id", user.id)
      .order("scheduled_at", { ascending: true, nullsFirst: false });

    if (error) return [];
    return data;
  } catch {
    return [];
  }
});

/**
 * Get one meeting by id, scoped to the current user.
 *
 * Returns `null` if the meeting doesn't exist, belongs to someone else (RLS
 * already prevents the row from being returned), Supabase is unconfigured,
 * or the request fails.
 */
export const getMeeting = cache(async (id: string): Promise<Meeting | null> => {
  if (!isSupabaseConfigured) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("meetings")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    return data;
  } catch {
    return null;
  }
});
