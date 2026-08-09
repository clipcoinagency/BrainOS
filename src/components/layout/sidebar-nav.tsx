"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navigation, secondaryNavigation } from "@/config/navigation";
import type { NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  /** Called after a link is clicked — used to close the mobile drawer. */
  onNavigate?: () => void;
}

/**
 * The primary navigation list, shared by the desktop sidebar and the mobile
 * drawer. Highlights the active route and marks planned modules.
 */
export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-6" aria-label="Primary">
      {navigation.map((section) => (
        <div key={section.label} className="space-y-1">
          <p className="text-muted-foreground/70 px-3 text-[11px] font-medium tracking-wider uppercase">
            {section.label}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => (
              <li key={item.href}>
                <NavLink
                  item={item}
                  active={isActive(pathname, item.href)}
                  onNavigate={onNavigate}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="mt-auto space-y-0.5 pt-2">
        {secondaryNavigation.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </nav>
  );
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "text-muted-foreground hover:bg-accent hover:text-foreground",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        active && "bg-accent text-foreground",
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          active
            ? "text-brand"
            : "text-muted-foreground group-hover:text-foreground",
        )}
      />
      <span className="truncate">{item.title}</span>
      {item.status === "planned" ? (
        <span
          className="bg-muted-foreground/50 ml-auto size-1.5 rounded-full"
          aria-hidden
        />
      ) : null}
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
