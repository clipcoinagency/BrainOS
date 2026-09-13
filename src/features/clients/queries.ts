import "server-only";

import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/lib/supabase/types";

/**
 * List the current user's clients, most recently added first.
 *
 * Returns an empty array (never throws) when Supabase is not configured or
 * the user is unauthenticated.
 */
export const listClients = cache(async (): Promise<Client[]> => {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return [];
    return data;
  } catch {
    return [];
  }
});
