import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
}

/**
 * A compact metric tile for the dashboard. Values are placeholders in the
 * foundation; wire real data via TanStack Query per module later.
 */
export function StatCard({ label, value, hint, icon: Icon }: StatCardProps) {
  return (
    <Card className="gap-0 py-4">
      <CardContent className="px-4">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs font-medium">{label}</p>
          <Icon className="text-muted-foreground/70 size-4" aria-hidden />
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        {hint ? (
          <p className="text-muted-foreground/70 mt-1 text-xs">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
