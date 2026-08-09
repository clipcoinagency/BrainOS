import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = {
  title: "Tasks",
};

export default function TasksPage() {
  return <ModulePlaceholder href="/tasks" />;
}
