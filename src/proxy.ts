import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Network-boundary handler. In Next.js 16 `middleware` was renamed to `proxy`
 * (runs on the Node.js runtime). We use it to refresh the Supabase session and
 * enforce authentication on every request.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  /**
   * Run on all routes except static assets and image files. Keeping the proxy
   * off static files avoids unnecessary work and cookie churn.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
