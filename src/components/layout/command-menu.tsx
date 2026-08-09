"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Monitor, Moon, Sun, Zap } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { navigation, secondaryNavigation } from "@/config/navigation";

const COMMAND_MENU_EVENT = "brainos:open-command-menu";

/** Programmatically open the command palette from anywhere on the client. */
export function openCommandMenu() {
  window.dispatchEvent(new Event(COMMAND_MENU_EVENT));
}

/**
 * Global command palette (⌘K / Ctrl+K).
 *
 * Provides fast navigation to every module plus quick actions. It reads the
 * central navigation config so new modules appear automatically.
 */
export function CommandMenu() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        (event.key === "k" && (event.metaKey || event.ctrlKey)) ||
        event.key === "/"
      ) {
        // Ignore "/" while typing in an input/textarea.
        if (
          event.key === "/" &&
          event.target instanceof HTMLElement &&
          ["INPUT", "TEXTAREA"].includes(event.target.tagName)
        ) {
          return;
        }
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    const onOpenEvent = () => setOpen(true);

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener(COMMAND_MENU_EVENT, onOpenEvent);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(COMMAND_MENU_EVENT, onOpenEvent);
    };
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command palette"
      description="Search modules and run quick actions"
    >
      <CommandInput placeholder="Search modules or type a command…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick actions">
          <CommandItem
            onSelect={() =>
              runCommand(() => toast("Quick capture — coming soon"))
            }
          >
            <Zap className="size-4" />
            Quick capture
          </CommandItem>
        </CommandGroup>

        {navigation.map((section) => (
          <CommandGroup key={section.label} heading={section.label}>
            {section.items.map((item) => (
              <CommandItem
                key={item.href}
                value={`${item.title} ${section.label}`}
                onSelect={() => runCommand(() => router.push(item.href))}
              >
                <item.icon className="size-4" />
                {item.title}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}

        <CommandGroup heading="Settings">
          {secondaryNavigation.map((item) => (
            <CommandItem
              key={item.href}
              onSelect={() => runCommand(() => router.push(item.href))}
            >
              <item.icon className="size-4" />
              {item.title}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
            <Sun className="size-4" />
            Light
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
            <Moon className="size-4" />
            Dark
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
            <Monitor className="size-4" />
            System
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
