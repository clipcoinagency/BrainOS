import Link from "next/link";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Logo } from "@/components/shared/logo";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * Desktop sidebar. Hidden below `lg`, where navigation moves into a drawer
 * (see `MobileNav`).
 */
export function AppSidebar() {
  return (
    <aside className="bg-sidebar hidden w-64 shrink-0 flex-col border-r lg:flex">
      <div className="flex h-16 items-center px-5">
        <Link
          href="/dashboard"
          className="focus-visible:ring-ring rounded-md focus-visible:ring-2 focus-visible:outline-none"
        >
          <Logo />
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3 pb-4">
        <SidebarNav />
      </ScrollArea>

      <div className="text-muted-foreground/60 border-t px-5 py-3 text-xs">
        v0.1 · Foundation
      </div>
    </aside>
  );
}
