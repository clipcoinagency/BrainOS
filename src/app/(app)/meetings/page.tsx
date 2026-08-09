import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = {
  title: "Meetings",
};

export default function MeetingsPage() {
  return <ModulePlaceholder href="/meetings" />;
}
