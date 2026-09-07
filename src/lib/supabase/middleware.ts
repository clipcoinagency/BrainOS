import { NextResponse, type NextRequest } from "next/server";

import { createServerClient } from "@supabase/ssr";

import { env, isSupabaseConfigured } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

/** Routes that unauthenticated visitors are allowed to reach. */
const PUBLIC_ROUTES = ["/login", "/signup"];

function isPublicRoute(pathname: string) {
  // `/auth/*` handles OAuth / email-confirmation callbacks.
  if (pathname.startsWith("/auth")) return true;
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/**
 * Refreshes the Supabase auth session on every request and enforces route
 * protection. Called from `proxy.ts` (Next.js 16's renamed middleware).
 *
 * When Supabase is not configured, this is a no-op so the app runs in guest
 * mode. When configured, unauthenticated users are redirected to `/login` and
 * authenticated users are kept out of the auth pages.
 *
 * IMPORTANT: always return the `supabaseResponse` (or a redirect that carries
 * its cookies) so refreshed auth cookies reach the browser.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!isSupabaseConfigured) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do NOT run code between createServerClient and getUser — it must run to
  // refresh the session token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Unauthenticated user on a protected route → send to login.
  if (!user && !isPublicRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return copyCookies(supabaseResponse, NextResponse.redirect(url));
  }

  // Authenticated user on an auth page → send to the app.
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return copyCookies(supabaseResponse, NextResponse.redirect(url));
  }

  return supabaseResponse;
}

/** Carry refreshed auth cookies from the working response onto a redirect. */
function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
  return to;
}
