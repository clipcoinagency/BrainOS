import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = {
  title: "Calendar",
};

export default function CalendarPage() {
  return <ModulePlaceholder href="/calendar" />;
}
