"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  FolderKanban,
  ListChecks,
  Loader2,
  Monitor,
  Moon,
  NotebookPen,
  Sun,
  Target,
  Zap,
} from "lucide-react";
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
import { createNote } from "@/features/notes/actions";
import { createProject } from "@/features/projects/actions";
import { createJournalEntry } from "@/features/journal/actions";
import { useSearchWorkspace } from "@/features/search";
import type { SearchResult } from "@/features/search";

import { openQuickCapture } from "./quick-capture-dialog";

const COMMAND_MENU_EVENT = "brainos:open-command-menu";

/** Programmatically open the command palette from anywhere on the client. */
export function openCommandMenu() {
  window.dispatchEvent(new Event(COMMAND_MENU_EVENT));
}

/** Today's date as "YYYY-MM-DD" in the BROWSER's local timezone. Duplicated
 * (in miniature) from the journal feature's own `todayIsoDate` rather than
 * imported — this shell component reaches the journal feature only through
 * its `actions` entry point, never its internal `lib`. Always compute this
 * client-side and pass it explicitly: letting the server default it would
 * use the server process's own timezone instead of the user's (see the
 * journal feature's `createJournalEntry` for the bug this avoids). */
function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function matches(query: string, ...haystack: string[]): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return haystack.some((value) => value.toLowerCase().includes(q));
}

const RESULT_ICON: Record<SearchResult["type"], typeof NotebookPen> = {
  note: NotebookPen,
  task: ListChecks,
  goal: Target,
  project: FolderKanban,
  journal: BookOpen,
};

/**
 * Global command palette (⌘K / Ctrl+K).
 *
 * Combines static navigation/quick-action/theme items with live,
 * server-searched results across modules. `shouldFilter={false}` on the
 * cmdk root because we're mixing those two sources — cmdk's own built-in
 * fuzzy filter has no way to know a server-side match happened against
 * content it never rendered (e.g. a note matched by body text), so every
 * group here filters itself against the raw query instead.
 */
export function CommandMenu() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { data: results, isFetching } = useSearchWorkspace(query);

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
    setQuery("");
    command();
  }, []);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setQuery("");
  }

  // Each of these runs AFTER runCommand has already closed the dialog (its
  // caller is `runCommand(() => { void handleNewX(); })`), so there is
  // nothing left in this component to show a pending/error state in-place —
  // a toast is the only feedback surface available by the time these settle.
  const handleNewNote = useCallback(async () => {
    const result = await createNote();
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    router.push(`/notes/${result.data.id}`);
  }, [router]);

  const handleNewProject = useCallback(async () => {
    const result = await createProject({ title: "Untitled project" });
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    router.push(`/projects/${result.data.id}`);
  }, [router]);

  const handleNewJournalEntry = useCallback(async () => {
    const result = await createJournalEntry({ entryDate: todayIsoDate() });
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    router.push(`/journal/${result.data.id}`);
  }, [router]);

  const quickActions = useMemo(
    () => [
      {
        key: "capture",
        label: "Quick capture",
        icon: Zap,
        onSelect: () => runCommand(openQuickCapture),
      },
      {
        key: "new-note",
        label: "New note",
        icon: NotebookPen,
        onSelect: () => runCommand(() => void handleNewNote()),
      },
      {
        key: "new-project",
        label: "New project",
        icon: FolderKanban,
        onSelect: () => runCommand(() => void handleNewProject()),
      },
      {
        key: "new-journal-entry",
        label: "New journal entry",
        icon: BookOpen,
        onSelect: () => runCommand(() => void handleNewJournalEntry()),
      },
      // Tasks/Goals have no "blank create" flow to jump straight into (both
      // are created via quick-add on their own list page, not a dedicated
      // detail route), so there's no equivalent one-click action for them
      // here — the existing "Tasks"/"Goals" navigation items below cover it.
    ],
    [runCommand, handleNewNote, handleNewProject, handleNewJournalEntry],
  );

  const visibleQuickActions = quickActions.filter((action) =>
    matches(query, action.label),
  );

  const visibleNavSections = navigation
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        matches(query, item.title, section.label),
      ),
    }))
    .filter((section) => section.items.length > 0);

  const visibleSecondary = secondaryNavigation.filter((item) =>
    matches(query, item.title),
  );

  const showThemeGroup = matches(query, "theme", "light", "dark", "system");
  const showSearchResults = query.trim().length >= 2;

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Command palette"
      description="Search modules and run quick actions"
      shouldFilter={false}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search modules or type a command…"
      />
      <CommandList>
        {showSearchResults &&
        !isFetching &&
        (results?.length ?? 0) === 0 &&
        visibleQuickActions.length === 0 &&
        visibleNavSections.length === 0 &&
        visibleSecondary.length === 0 ? (
          <CommandEmpty>No results found.</CommandEmpty>
        ) : null}

        {visibleQuickActions.length > 0 ? (
          <CommandGroup heading="Quick actions">
            {visibleQuickActions.map((action) => (
              <CommandItem
                key={action.key}
                value={action.key}
                onSelect={action.onSelect}
              >
                <action.icon className="size-4" />
                {action.label}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {showSearchResults && (isFetching || (results?.length ?? 0) > 0) ? (
          <CommandGroup heading="Results">
            {isFetching ? (
              <CommandItem disabled value="__loading">
                <Loader2 className="size-4 animate-spin" />
                Searching…
              </CommandItem>
            ) : (
              (results ?? []).map((result) => {
                const Icon = RESULT_ICON[result.type];
                return (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    value={`${result.type}-${result.id}`}
                    onSelect={() => runCommand(() => router.push(result.href))}
                  >
                    <Icon className="size-4" />
                    <span className="truncate">{result.title}</span>
                    <span className="text-muted-foreground ml-auto text-xs">
                      {result.subtitle}
                    </span>
                  </CommandItem>
                );
              })
            )}
          </CommandGroup>
        ) : null}

        {visibleNavSections.map((section) => (
          <CommandGroup key={section.label} heading={section.label}>
            {section.items.map((item) => (
              <CommandItem
                key={item.href}
                value={item.href}
                onSelect={() => runCommand(() => router.push(item.href))}
              >
                <item.icon className="size-4" />
                {item.title}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}

        {visibleSecondary.length > 0 ? (
          <CommandGroup heading="Settings">
            {visibleSecondary.map((item) => (
              <CommandItem
                key={item.href}
                value={item.href}
                onSelect={() => runCommand(() => router.push(item.href))}
              >
                <item.icon className="size-4" />
                {item.title}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {showThemeGroup ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Theme">
              <CommandItem
                value="theme-light"
                onSelect={() => runCommand(() => setTheme("light"))}
              >
                <Sun className="size-4" />
                Light
              </CommandItem>
              <CommandItem
                value="theme-dark"
                onSelect={() => runCommand(() => setTheme("dark"))}
              >
                <Moon className="size-4" />
                Dark
              </CommandItem>
              <CommandItem
                value="theme-system"
                onSelect={() => runCommand(() => setTheme("system"))}
              >
                <Monitor className="size-4" />
                System
              </CommandItem>
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
