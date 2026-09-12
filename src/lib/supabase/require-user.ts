import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/env";

import { createClient } from "./server";
import type { Database } from "./types";

export type UserContext =
  { error: string } | { supabase: SupabaseClient<Database>; user: User };

/**
 * Resolve the authenticated Supabase client + user, or a friendly error.
 *
 * The first line every mutating (and most reading) Server Action calls.
 * `featureNamePlural` only shapes the "not configured" message (e.g. "Notes",
 * "Tasks") — extracted here once every feature had its own byte-for-byte
 * copy of this function.
 */
export async function requireUser(
  featureNamePlural: string,
): Promise<UserContext> {
  if (!isSupabaseConfigured) {
    return {
      error: `${featureNamePlural} require a connected database. Add your Supabase credentials to .env.local.`,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  return { supabase, user };
}
