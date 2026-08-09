import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = {
  title: "AI Assistant",
};

export default function AssistantPage() {
  return <ModulePlaceholder href="/assistant" />;
}
