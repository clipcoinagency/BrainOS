import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = {
  title: "Files",
};

export default function FilesPage() {
  return <ModulePlaceholder href="/files" />;
}
