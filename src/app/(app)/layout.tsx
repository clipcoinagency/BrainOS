import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { CommandMenu } from "@/components/layout/command-menu";
import { QuickCaptureDialog } from "@/components/layout/quick-capture-dialog";
import type { ShellUser } from "@/components/layout/user-menu";
import { getUser } from "@/features/auth/queries";
import { isSupabaseConfigured } from "@/lib/env";

const GUEST: ShellUser = {
  name: "Guest",
  email: "guest@brainos.local",
  initials: "G",
};

function toShellUser(name: string, email: string): ShellUser {
  const initials =
    name
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";
  return { name, email, initials };
}

/**
 * The authenticated application shell: persistent sidebar + top bar wrapping
 * every module page. Route group `(app)` keeps these routes URL-clean
 * (e.g. `/dashboard`, not `/app/dashboard`).
 *
 * When Supabase is configured, unauthenticated users are redirected to /login
 * (defense-in-depth alongside `proxy.ts`). When it isn't, the shell runs in
 * guest mode so the foundation is usable with no setup.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (isSupabaseConfigured && !user) {
    redirect("/login");
  }

  const metadataName =
    typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : undefined;

  const shellUser: ShellUser = user
    ? toShellUser(
        metadataName ?? user.email?.split("@")[0] ?? "User",
        user.email ?? "",
      )
    : GUEST;

  return (
    <div className="flex min-h-dvh">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar user={shellUser} authenticated={Boolean(user)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
      {/* Global command palette and quick-capture dialog — each mounted once
          for the whole shell, opened from anywhere via a DOM event. */}
      <CommandMenu />
      <QuickCaptureDialog />
    </div>
  );
}
