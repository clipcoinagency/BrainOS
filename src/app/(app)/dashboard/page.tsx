import type { Metadata } from "next";
import {
  CalendarDays,
  Database,
  ListChecks,
  NotebookPen,
  Sparkles,
  Target,
} from "lucide-react";

import { ModuleCard } from "@/components/shared/module-card";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { allModules } from "@/config/navigation";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Dashboard",
};

const stats = [
  { label: "Notes", value: "—", hint: "No notes yet", icon: NotebookPen },
  { label: "Open tasks", value: "—", hint: "Nothing due", icon: ListChecks },
  {
    label: "Active goals",
    value: "—",
    hint: "Set your first goal",
    icon: Target,
  },
  { label: "This week", value: "—", hint: "No events", icon: CalendarDays },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="bg-grid-glow relative overflow-hidden rounded-2xl border p-6 sm:p-8">
        <p className="text-muted-foreground text-sm">{today}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-balance">
          {greeting()}, welcome to BrainOS
        </h1>
        <p className="text-muted-foreground mt-2 max-w-xl text-sm text-pretty">
          Your personal operating system. This is the foundation — the shell,
          navigation, and design system are ready. Pick a module below to see
          where your work will live.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="size-3" />
            Foundation v0.1
          </Badge>
        </div>
      </section>

      {/* Stats */}
      <section
        aria-label="Overview"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      {/* Setup hint when Supabase is not configured */}
      {!isSupabaseConfigured ? (
        <Card className="border-brand/30 bg-brand/5">
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="bg-brand/15 text-brand flex size-9 shrink-0 items-center justify-center rounded-lg">
                <Database className="size-5" />
              </span>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Connect your database</p>
                <p className="text-muted-foreground text-sm text-pretty">
                  Add your Supabase URL and anon key to{" "}
                  <code className="bg-muted rounded px-1 py-0.5 text-xs">
                    .env.local
                  </code>{" "}
                  to enable data features. See{" "}
                  <code className="bg-muted rounded px-1 py-0.5 text-xs">
                    .env.example
                  </code>
                  .
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Modules */}
      <section aria-label="Modules" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Modules</h2>
          <p className="text-muted-foreground text-sm">
            {allModules.length} planned
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allModules.map((module) => (
            <ModuleCard key={module.href} module={module} />
          ))}
        </div>
      </section>
    </div>
  );
}
