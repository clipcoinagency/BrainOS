"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * Mobile navigation drawer. Shown below `lg` in place of the desktop sidebar.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="h-16 justify-center px-5">
          <SheetTitle asChild>
            <Link href="/dashboard" onClick={() => setOpen(false)}>
              <Logo />
            </Link>
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100dvh-4rem)] px-3 pb-6">
          <SidebarNav onNavigate={() => setOpen(false)} />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
