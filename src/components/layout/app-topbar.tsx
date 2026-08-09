"use client";

import { Bell, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { MobileNav } from "@/components/layout/mobile-nav";
import { openCommandMenu } from "@/components/layout/command-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";

/**
 * Sticky top bar for the app shell: mobile nav trigger, global search
 * (opens the command palette), quick capture, notifications, theme, account.
 */
export function AppTopbar() {
  return (
    <header className="bg-background/80 sticky top-0 z-30 flex h-16 items-center gap-2 border-b px-4 backdrop-blur-md sm:px-6">
      <MobileNav />

      {/* Command palette trigger, styled as a search field. */}
      <button
        type="button"
        onClick={openCommandMenu}
        className="text-muted-foreground bg-muted/50 hover:bg-muted focus-visible:ring-ring flex h-9 w-full max-w-sm items-center gap-2 rounded-lg border px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <Search className="size-4 shrink-0" />
        <span className="truncate">Search or jump to…</span>
        <kbd className="bg-background text-muted-foreground pointer-events-none ml-auto hidden h-5 items-center gap-0.5 rounded border px-1.5 font-mono text-[10px] font-medium select-none sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <Button
          size="sm"
          className="hidden sm:inline-flex"
          onClick={() => toast("Quick capture — coming soon")}
        >
          <Plus className="size-4" />
          Capture
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          onClick={() => toast("No new notifications")}
        >
          <Bell className="size-[1.15rem]" />
        </Button>
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
