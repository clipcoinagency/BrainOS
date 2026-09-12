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
import { useCreateNote } from "@/features/notes";
import { useCreateProject } from "@/features/projects";
import { useCreateJournalEntry } from "@/features/journal";
import { MIN_SEARCH_QUERY_LENGTH, useSearchWorkspace } from "@/features/search";
import type { SearchResult } from "@/features/search";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

import { openQuickCapture } from "./quick-capture-dialog";

const COMMAND_MENU_EVENT = "brainos:open-command-menu";
const SEARCH_DEBOUNCE_MS = 250;

/** Programmatically open the command palette from anywhere on the client. */
export function openCommandMenu() {
  window.dispatchEvent(new Event(COMMAND_MENU_EVENT));
}

/** Today's date as "YYYY-MM-DD" in the BROWSER's local timezone. Duplicated
 * (in miniature) from the journal feature's own `todayIsoDate` rather than
 * imported — this shell component reaches the journal feature only through
 * its public barrel, never its internal `lib`. Always compute this
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
  // `query` drives the visible input text immediately; `debouncedQuery` is
  // what's actually searched. Without this split, every keystroke would
  // fire a fresh Server Action (5 Supabase queries) and briefly unmount the
  // whole Results group — which, per cmdk's own reselection behavior, can
  // silently kick keyboard selection back to the top of the palette.
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceSearch = useDebouncedCallback(
    setDebouncedQuery,
    SEARCH_DEBOUNCE_MS,
  );

  const { data: results, isFetching } = useSearchWorkspace(debouncedQuery);
  const createNote = useCreateNote();
  const createProject = useCreateProject();
  const createJournalEntry = useCreateJournalEntry();

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
    setDebouncedQuery("");
    command();
  }, []);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      setDebouncedQuery("");
    }
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    debounceSearch(value);
  }

  // Each of these goes through the feature's own useCreateX mutation hook
  // (not the bare "use server" action) so a note/project/entry created here
  // invalidates the SAME TanStack Query cache the feature's own list page
  // reads — calling the action directly would still create the row (and
  // Next's revalidatePath would refresh a fresh server render), but the
  // client-side list cache, if already populated from an earlier visit,
  // would silently stay stale until it happened to go stale on its own.
  // useMutation also guarantees onError fires even if the action rejects
  // outright rather than resolving to {error} — a plain `await` here, with
  // the dialog already closed by the time it settles, would otherwise risk
  // an unhandled rejection with no feedback surface at all.
  const handleNewNote = useCallback(() => {
    createNote.mutate(undefined, {
      onSuccess: (result) => {
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        router.push(`/notes/${result.data.id}`);
      },
      onError: () => toast.error("Failed to create note."),
    });
  }, [createNote, router]);

  const handleNewProject = useCallback(() => {
    createProject.mutate(
      { title: "Untitled project" },
      {
        onSuccess: (result) => {
          if ("error" in result) {
            toast.error(result.error);
            return;
          }
          router.push(`/projects/${result.data.id}`);
        },
        onError: () => toast.error("Failed to create project."),
      },
    );
  }, [createProject, router]);

  const handleNewJournalEntry = useCallback(() => {
    createJournalEntry.mutate(
      { entryDate: todayIsoDate() },
      {
        onSuccess: (result) => {
          if ("error" in result) {
            toast.error(result.error);
            return;
          }
          router.push(`/journal/${result.data.id}`);
        },
        onError: () => toast.error("Failed to create journal entry."),
      },
    );
  }, [createJournalEntry, router]);

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
        onSelect: () => runCommand(handleNewNote),
      },
      {
        key: "new-project",
        label: "New project",
        icon: FolderKanban,
        onSelect: () => runCommand(handleNewProject),
      },
      {
        key: "new-journal-entry",
        label: "New journal entry",
        icon: BookOpen,
        onSelect: () => runCommand(handleNewJournalEntry),
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
  const showSearchResults =
    debouncedQuery.trim().length >= MIN_SEARCH_QUERY_LENGTH;
  const resultCount = results?.length ?? 0;

  // Announced to screen readers outside CommandList — cmdk's own list/group/
  // item roles (listbox/presentation/option) don't expose a live region, so
  // a non-navigating screen reader user would otherwise have no way to know
  // a search ran, is running, or how many results it found.
  const searchStatusMessage = !showSearchResults
    ? ""
    : isFetching
      ? "Searching…"
      : resultCount > 0
        ? `${resultCount} result${resultCount === 1 ? "" : "s"} found`
        : "No results found";

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
        onValueChange={handleQueryChange}
        placeholder="Search modules or type a command…"
        aria-label="Search modules or type a command"
      />
      <span role="status" aria-live="polite" className="sr-only">
        {searchStatusMessage}
      </span>
      <CommandList>
        {showSearchResults &&
        !isFetching &&
        resultCount === 0 &&
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

        {showSearchResults && (isFetching || resultCount > 0) ? (
          <CommandGroup heading="Results">
            {isFetching && resultCount === 0 ? (
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
                {item.status === "planned" ? (
                  <span className="text-muted-foreground ml-auto text-xs">
                    Soon
                  </span>
                ) : null}
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
                {item.status === "planned" ? (
                  <span className="text-muted-foreground ml-auto text-xs">
                    Soon
                  </span>
                ) : null}
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
