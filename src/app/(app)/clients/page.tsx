import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = {
  title: "Clients",
};

export default function ClientsPage() {
  return <ModulePlaceholder href="/clients" />;
}
