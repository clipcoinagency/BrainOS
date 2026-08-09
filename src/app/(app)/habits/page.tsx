import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = {
  title: "Habits",
};

export default function HabitsPage() {
  return <ModulePlaceholder href="/habits" />;
}
