import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = {
  title: "Journal",
};

export default function JournalPage() {
  return <ModulePlaceholder href="/journal" />;
}
