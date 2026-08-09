import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { NavItem } from "@/config/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * A clickable card representing a module, used in the dashboard grid.
 */
export function ModuleCard({ module }: { module: NavItem }) {
  const Icon = module.icon;
  const isAvailable = module.status === "available";

  return (
    <Link
      href={module.href}
      className={cn(
        "group bg-card relative flex flex-col gap-3 rounded-xl border p-4 transition-all",
        "hover:border-brand/40 focus-visible:ring-ring hover:shadow-sm focus-visible:ring-2 focus-visible:outline-none",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-lg transition-colors",
            isAvailable
              ? "bg-brand/15 text-brand"
              : "bg-muted text-muted-foreground group-hover:text-foreground",
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <ArrowUpRight className="text-muted-foreground/50 group-hover:text-foreground size-4 transition-colors" />
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">{module.title}</h3>
          {!isAvailable ? (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              Soon
            </Badge>
          ) : null}
        </div>
        <p className="text-muted-foreground line-clamp-2 text-xs text-pretty">
          {module.description}
        </p>
      </div>
    </Link>
  );
}
