import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NoteEditor } from "@/features/notes";
import { getNote } from "@/features/notes/queries";

interface NotePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: NotePageProps): Promise<Metadata> {
  const { id } = await params;
  const note = await getNote(id);
  if (!note) return { title: "Note not found" };
  return { title: note.title.trim() || "Untitled note" };
}

export default async function NotePage({ params }: NotePageProps) {
  const { id } = await params;
  const note = await getNote(id);

  if (!note) notFound();

  return <NoteEditor note={note} />;
}
