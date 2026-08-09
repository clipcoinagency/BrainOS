import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = {
  title: "Knowledge Base",
};

export default function KnowledgePage() {
  return <ModulePlaceholder href="/knowledge" />;
}
