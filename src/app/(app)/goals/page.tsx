import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = {
  title: "Goals",
};

export default function GoalsPage() {
  return <ModulePlaceholder href="/goals" />;
}
