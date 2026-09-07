"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { env, isSupabaseConfigured } from "@/lib/env";
import { safeInternalPath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

import { loginSchema, signupSchema } from "./schemas";
import type { LoginInput, SignupInput } from "./schemas";

/** Discriminated result returned to the client (or nothing, on redirect). */
export type AuthResult = { error: string } | { success: string };

const NOT_CONFIGURED =
  "Authentication is not configured. Add your Supabase credentials to .env.local.";

/**
 * The canonical origin for building outbound links (e.g. email confirmation).
 * Prefers a configured, trusted value over the request Host header, which a
 * reverse proxy could forge (host-header injection).
 */
async function getOrigin() {
  if (env.NEXT_PUBLIC_SITE_URL) return env.NEXT_PUBLIC_SITE_URL;
  const headerStore = await headers();
  return (
    headerStore.get("origin") ??
    (headerStore.get("host")
      ? `https://${headerStore.get("host")}`
      : "http://localhost:3000")
  );
}

/**
 * Sign in with email + password. On success, revalidates and redirects to
 * `redirectTo` (or the dashboard). On failure, returns an error message.
 */
export async function signIn(
  values: LoginInput,
  redirectTo?: string,
): Promise<AuthResult> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };

  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return { error: "Please check the form and try again." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect(safeInternalPath(redirectTo));
}

/**
 * Create an account. If email confirmation is enabled, returns a success
 * message; otherwise signs the user in and redirects to the dashboard.
 */
export async function signUp(values: SignupInput): Promise<AuthResult> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };

  const parsed = signupSchema.safeParse(values);
  if (!parsed.success) return { error: "Please check the form and try again." };

  const { fullName, email, password } = parsed.data;
  const supabase = await createClient();
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) return { error: error.message };

  // When email confirmation is required there is no active session yet.
  if (!data.session) {
    return {
      success: "Account created. Check your email to confirm your address.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/** Sign out and return to the login page. */
export async function signOut(): Promise<void> {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
  }
  redirect("/login");
}
