import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = {
  title: "Notes",
};

export default function NotesPage() {
  return <ModulePlaceholder href="/notes" />;
}
