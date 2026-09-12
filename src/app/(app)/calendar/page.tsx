import type { Metadata } from "next";
import { Database } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarView } from "@/features/calendar";
import {
  getMonthGridRange,
  parseMonthParam,
} from "@/features/calendar/lib/month";
import { listCalendarEvents } from "@/features/calendar/queries";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Calendar",
};

interface CalendarPageProps {
  searchParams: Promise<{ month?: string }>;
}

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function CalendarPage({
  searchParams,
}: CalendarPageProps) {
  const { month: monthParamValue } = await searchParams;
  const today = todayIsoDate();
  const [todayYear, todayMonth] = today.split("-").map(Number);
  const { year, month } = parseMonthParam(monthParamValue, {
    year: todayYear,
    month: todayMonth,
  });

  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Calendar"
          description="See your schedule across every module."
        />
        <Card className="border-brand/30 bg-brand/5">
          <CardContent className="flex items-start gap-3">
            <span className="bg-brand/15 text-brand flex size-9 shrink-0 items-center justify-center rounded-lg">
              <Database className="size-5" />
            </span>
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Connect your database</p>
              <p className="text-muted-foreground text-sm text-pretty">
                Your calendar aggregates task due dates, goal/project target
                dates, and journal entries from Supabase. Add your{" "}
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
                </code>
                . See{" "}
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

  const { start, endExclusive } = getMonthGridRange(year, month);
  const events = await listCalendarEvents(start, endExclusive);

  return (
    <CalendarView year={year} month={month} todayIso={today} events={events} />
  );
}
