import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JournalEntryEditor } from "@/features/journal";
import { getJournalEntry } from "@/features/journal/queries";
import { formatEntryDate } from "@/features/journal/lib/date";

interface JournalEntryPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: JournalEntryPageProps): Promise<Metadata> {
  const { id } = await params;
  const entry = await getJournalEntry(id);
  if (!entry) return { title: "Entry not found" };
  return { title: formatEntryDate(entry.entry_date) };
}

export default async function JournalEntryPage({
  params,
}: JournalEntryPageProps) {
  const { id } = await params;
  const entry = await getJournalEntry(id);

  if (!entry) notFound();

  return <JournalEntryEditor entry={entry} />;
}
