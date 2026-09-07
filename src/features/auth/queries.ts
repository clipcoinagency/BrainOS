import "server-only";

import type { User } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

/**
 * Get the currently authenticated user on the server, or `null`.
 *
 * Returns `null` (never throws) when Supabase is not configured, so callers can
 * treat "guest mode" and "signed out" uniformly.
 */
export async function getUser(): Promise<User | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    // Treat an unreachable auth service as "signed out" rather than crashing
    // the whole shell render.
    return null;
  }
}

/** Get the current user's profile row, or `null`. */
export async function getProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return data;
  } catch {
    return null;
  }
}
