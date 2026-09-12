"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { JournalEntry } from "@/lib/supabase/types";

import {
  useCreateJournalEntry,
  useJournalEntriesQuery,
} from "../hooks/use-journal";
import { formatEntryDateShort, todayIsoDate } from "../lib/date";
import { DeleteJournalEntryDialog } from "./delete-journal-entry-dialog";
import { JournalEntryCard } from "./journal-entry-card";

export function JournalView({
  initialEntries,
}: {
  initialEntries: JournalEntry[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { data: entries } = useJournalEntriesQuery(initialEntries);
  const createEntry = useCreateJournalEntry();

  // The entry pending delete confirmation. Owned here (not inside
  // JournalEntryCard) so the confirmation dialog stays mounted through its
  // own close transition even though the optimistic delete removes the
  // entry — and its card — from this list the instant the user confirms.
  const [deleteTarget, setDeleteTarget] = useState<JournalEntry | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((entry) => entry.content.toLowerCase().includes(q));
  }, [entries, query]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => (a.entry_date < b.entry_date ? 1 : -1));
  }, [filtered]);

  function handleNewEntry() {
    // "New entry" means "today's entry" — if it already exists, open it
    // instead of trying (and failing, on the unique constraint) to create a
    // second one for the same day.
    const today = todayIsoDate();
    const existing = entries.find((entry) => entry.entry_date === today);
    if (existing) {
      router.push(`/journal/${existing.id}`);
      return;
    }

    createEntry.mutate(undefined, {
      onSuccess: (result) => {
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        router.push(`/journal/${result.data.id}`);
      },
      onError: () => toast.error("Failed to create journal entry."),
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal"
        description="Daily entries and reflective writing."
        actions={
          <Button onClick={handleNewEntry} disabled={createEntry.isPending}>
            {createEntry.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            New entry
          </Button>
        }
      />

      {entries.length > 0 ? (
        <div className="relative max-w-sm">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search entries…"
            className="pl-8"
            aria-label="Search journal entries"
          />
        </div>
      ) : null}

      {entries.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No entries yet"
          description="Write your first journal entry to start reflecting on your days."
          action={
            <Button onClick={handleNewEntry} disabled={createEntry.isPending}>
              {createEntry.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              New entry
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching entries"
          description={`Nothing matches "${query}". Try a different search.`}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((entry) => (
            <JournalEntryCard
              key={entry.id}
              entry={entry}
              onRequestDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <DeleteJournalEntryDialog
        entryId={deleteTarget?.id ?? ""}
        entryDateLabel={
          deleteTarget ? formatEntryDateShort(deleteTarget.entry_date) : ""
        }
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
