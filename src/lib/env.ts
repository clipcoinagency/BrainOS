import { z } from "zod";

/**
 * Type-safe, validated access to environment variables.
 *
 * Only `NEXT_PUBLIC_*` variables are referenced here so they can be safely
 * inlined into the client bundle by Next.js. Server-only secrets should be
 * added to a separate server schema and never exported to the client.
 *
 * Supabase variables are intentionally OPTIONAL so the foundation runs with no
 * configuration. Consumers check `isSupabaseConfigured` before creating a
 * client, and the client factories throw a clear error if used unconfigured.
 */
const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  // Canonical public origin, used to build trusted outbound links (e.g. email
  // confirmation) instead of the spoofable request Host header.
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

// Reference each variable by its full name so Next.js can statically inline it.
const parsed = clientSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

if (!parsed.success) {
  // Surface misconfiguration early and readably rather than failing deep in a
  // request with a cryptic error.
  console.error(
    "❌ Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error("Invalid environment variables. See logs above.");
}

export const env = parsed.data;

/** Whether Supabase credentials are present. Gate DB features behind this. */
export const isSupabaseConfigured =
  Boolean(env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
