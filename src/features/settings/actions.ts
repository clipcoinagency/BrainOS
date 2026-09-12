"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/supabase/require-user";
import type { Profile } from "@/lib/supabase/types";

import { updateProfileSchema } from "./schemas";
import type { UpdateProfileInput } from "./schemas";

/** Discriminated result returned to the client. */
export type SettingsResult<T> = { data: T } | { error: string };

/**
 * Update the current user's display name.
 *
 * `profiles` is the SINGLE source of truth for the display name — the app
 * shell's layout reads it (via `getProfile()`, same as this page) to render
 * the sidebar/topbar name, rather than reading Supabase Auth's separate
 * `user_metadata` copy. An earlier version wrote both stores in parallel;
 * that let one write silently succeed while the other failed, leaving the
 * sidebar and this page permanently showing two different names with no
 * error that explained why. Writing exactly one place removes the
 * possibility of that split entirely, rather than trying to reconcile it
 * after the fact.
 *
 * Uses `upsert` rather than `update`: the `handle_new_user` trigger creates
 * a `profiles` row for every new signup, but `getProfile()`'s own fallback
 * (see `src/app/(app)/settings/page.tsx`) already acknowledges that row can
 * transiently not exist yet — a plain `.update()` would match zero rows in
 * that case and PostgREST's `.single()` would treat that as a permanent
 * error, one no retry could ever clear (UPDATE can't create a row).
 */
export async function updateProfile(
  input: UpdateProfileInput,
): Promise<SettingsResult<Profile>> {
  const ctx = await requireUser("Settings");
  if ("error" in ctx) return { error: ctx.error };

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check your name and try again." };
  }

  const { supabase, user } = ctx;
  const { fullName } = parsed.data;

  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, full_name: fullName })
    .select()
    .single();

  if (error || !data) return { error: "Failed to update your profile." };

  // The shell's name comes from a Server Component layout — revalidating it
  // here (paired with the client calling `router.refresh()`) is what makes
  // the new name actually show up outside this page.
  revalidatePath("/", "layout");
  return { data };
}
