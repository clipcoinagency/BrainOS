import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  formatMonthLabel,
  getMonthGrid,
  monthParam,
  shiftMonth,
} from "../lib/month";
import type { CalendarEvent, CalendarEventType } from "../types";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EVENT_TYPE_DOT_CLASSNAME: Record<CalendarEventType, string> = {
  task: "bg-chart-1",
  goal: "bg-chart-3",
  project: "bg-brand",
  journal: "bg-chart-4",
};

const EVENT_TYPE_LABEL: Record<CalendarEventType, string> = {
  task: "Task",
  goal: "Goal",
  project: "Project",
  journal: "Journal",
};

const MAX_EVENTS_PER_DAY = 3;

export function CalendarView({
  year,
  month,
  todayIso,
  events,
}: {
  year: number;
  month: number;
  todayIso: string;
  events: CalendarEvent[];
}) {
  const days = getMonthGrid(year, month, todayIso);
  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const list = eventsByDate.get(event.date) ?? [];
    list.push(event);
    eventsByDate.set(event.date, list);
  }

  const previous = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="See your schedule across every module."
        actions={
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" asChild>
              <Link
                href={`/calendar?month=${monthParam(previous.year, previous.month)}`}
                aria-label="Previous month"
              >
                <ChevronLeft className="size-4" />
              </Link>
            </Button>
            <span className="w-36 text-center text-sm font-medium">
              {formatMonthLabel(year, month)}
            </span>
            <Button variant="outline" size="icon" asChild>
              <Link
                href={`/calendar?month=${monthParam(next.year, next.month)}`}
                aria-label="Next month"
              >
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3 text-xs">
        {(Object.keys(EVENT_TYPE_LABEL) as CalendarEventType[]).map((type) => (
          <span key={type} className="flex items-center gap-1.5">
            <span
              className={cn(
                "size-2 rounded-full",
                EVENT_TYPE_DOT_CLASSNAME[type],
              )}
              aria-hidden="true"
            />
            {EVENT_TYPE_LABEL[type]}
          </span>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border">
        <div className="bg-muted/50 grid grid-cols-7 border-b">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="text-muted-foreground p-2 text-center text-xs font-medium"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayEvents = eventsByDate.get(day.date) ?? [];
            const visible = dayEvents.slice(0, MAX_EVENTS_PER_DAY);
            const overflow = dayEvents.length - visible.length;

            return (
              <div
                key={day.date}
                className={cn(
                  "flex min-h-24 flex-col gap-1 border-r border-b p-1.5 [&:nth-child(7n)]:border-r-0",
                  !day.isCurrentMonth && "bg-muted/20",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs",
                    day.isToday
                      ? "bg-brand text-primary-foreground font-semibold"
                      : day.isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground/50",
                  )}
                >
                  {day.day}
                </span>

                <div className="flex flex-col gap-0.5">
                  {visible.map((event) => (
                    <Link
                      key={`${event.type}-${event.id}`}
                      href={event.href}
                      className="hover:bg-muted flex items-center gap-1 rounded px-1 py-0.5 text-[11px]"
                    >
                      <span
                        className={cn(
                          "size-1.5 shrink-0 rounded-full",
                          EVENT_TYPE_DOT_CLASSNAME[event.type],
                        )}
                        aria-hidden="true"
                      />
                      <span className="truncate">{event.title}</span>
                    </Link>
                  ))}
                  {overflow > 0 ? (
                    <span className="text-muted-foreground px-1 text-[11px]">
                      +{overflow} more
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
