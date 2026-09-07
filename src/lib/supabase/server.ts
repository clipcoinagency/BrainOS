import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

import { env, isSupabaseConfigured } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

/**
 * Create a Supabase client for use on the server (Server Components, Route
 * Handlers, Server Actions).
 *
 * In Next.js 16 `cookies()` is async, so this factory is async too. Cookie
 * writes from Server Components are wrapped in try/catch because they are only
 * permitted in Server Actions and Route Handlers; the middleware/proxy layer is
 * responsible for refreshing the session cookie on navigation.
 *
 * @throws if Supabase environment variables are not configured.
 */
export async function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore when a
            // middleware/proxy is refreshing the session.
          }
        },
      },
    },
  );
}
