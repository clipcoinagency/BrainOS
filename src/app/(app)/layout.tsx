import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { CommandMenu } from "@/components/layout/command-menu";

/**
 * The authenticated application shell: persistent sidebar + top bar wrapping
 * every module page. Route group `(app)` keeps these routes URL-clean
 * (e.g. `/dashboard`, not `/app/dashboard`).
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
      {/* Global command palette — mounted once for the whole shell. */}
      <CommandMenu />
    </div>
  );
}
