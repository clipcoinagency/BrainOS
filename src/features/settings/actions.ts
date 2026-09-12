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
 * Writes to both the `profiles` table (the durable, queryable record) and
 * Supabase Auth's own `user_metadata` (the copy embedded in the session that
 * the app shell's layout reads via `getUser()` to render the sidebar/topbar
 * name — see `src/app/(app)/layout.tsx`). These are kept in sync
 * deliberately: a client bound to only one of them would show a stale name
 * wherever the other is read from.
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

  const [profileResult, authResult] = await Promise.all([
    supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id)
      .select()
      .single(),
    supabase.auth.updateUser({ data: { full_name: fullName } }),
  ]);

  if (profileResult.error || authResult.error || !profileResult.data) {
    return { error: "Failed to update your profile." };
  }

  // The shell's name comes from a Server Component layout — revalidating it
  // here (paired with the client calling `router.refresh()`) is what makes
  // the new name actually show up outside this page.
  revalidatePath("/", "layout");
  return { data: profileResult.data };
}
