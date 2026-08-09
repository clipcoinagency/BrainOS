import { createBrowserClient } from "@supabase/ssr";

import { env, isSupabaseConfigured } from "@/lib/env";

/**
 * Create a Supabase client for use in the browser (Client Components).
 *
 * Safe to call on every render — `createBrowserClient` memoizes the underlying
 * client per set of credentials.
 *
 * @throws if Supabase environment variables are not configured.
 */
export function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.",
    );
  }

  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
