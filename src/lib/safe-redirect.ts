/**
 * Return `candidate` only if it is a safe, same-origin *relative* path;
 * otherwise return `fallback`.
 *
 * Prevents open-redirect attacks: a naive `startsWith("/")` check still allows
 * protocol-relative URLs (`//evil.com`) and backslash tricks (`/\evil.com`),
 * both of which browsers resolve to an external origin.
 */
export function safeInternalPath(
  candidate: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!candidate) return fallback;
  if (!candidate.startsWith("/")) return fallback;
  // Reject protocol-relative ("//host") and backslash-prefixed ("/\host").
  if (candidate.startsWith("//") || candidate.startsWith("/\\"))
    return fallback;
  return candidate;
}
