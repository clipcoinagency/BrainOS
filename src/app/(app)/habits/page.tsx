import type { Metadata } from "next";
import { Database } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { HabitsView } from "@/features/habits";
import { listHabits } from "@/features/habits/queries";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Habits",
};

export default async function HabitsPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Habits"
          description="Build streaks and track daily routines."
        />
        <Card className="border-brand/30 bg-brand/5">
          <CardContent className="flex items-start gap-3">
            <span className="bg-brand/15 text-brand flex size-9 shrink-0 items-center justify-center rounded-lg">
              <Database className="size-5" />
            </span>
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Connect your database</p>
              <p className="text-muted-foreground text-sm text-pretty">
                Habits are stored in Supabase. Add your{" "}
                <code className="bg-muted rounded px-1 py-0.5 text-xs">
                  NEXT_PUBLIC_SUPABASE_URL
                </code>{" "}
                and{" "}
                <code className="bg-muted rounded px-1 py-0.5 text-xs">
                  NEXT_PUBLIC_SUPABASE_ANON_KEY
                </code>{" "}
                to{" "}
                <code className="bg-muted rounded px-1 py-0.5 text-xs">
                  .env.local
                </code>{" "}
                to start tracking habits. See{" "}
                <code className="bg-muted rounded px-1 py-0.5 text-xs">
                  supabase/README.md
                </code>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const habits = await listHabits();

  return <HabitsView initialHabits={habits} />;
}
