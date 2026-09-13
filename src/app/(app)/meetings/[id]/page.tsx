import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MeetingEditor } from "@/features/meetings";
import { getMeeting } from "@/features/meetings/queries";

interface MeetingPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: MeetingPageProps): Promise<Metadata> {
  const { id } = await params;
  const meeting = await getMeeting(id);
  if (!meeting) return { title: "Meeting not found" };
  return { title: meeting.title.trim() || "Untitled meeting" };
}

export default async function MeetingPage({ params }: MeetingPageProps) {
  const { id } = await params;
  const meeting = await getMeeting(id);

  if (!meeting) notFound();

  return <MeetingEditor meeting={meeting} />;
}
