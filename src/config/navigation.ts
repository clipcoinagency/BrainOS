import {
  Activity,
  Bot,
  BookOpen,
  Calendar,
  CircleDollarSign,
  FolderKanban,
  FolderOpen,
  LayoutDashboard,
  Library,
  ListChecks,
  NotebookPen,
  Settings,
  Target,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";

/**
 * Lifecycle status for a module. Drives badges in the UI and the roadmap.
 * - `available`: shipped and routable with real functionality
 * - `planned`: routable placeholder, implementation to come
 */
export type ModuleStatus = "available" | "planned";

export interface NavItem {
  /** Human-readable label shown in the sidebar. */
  title: string;
  /** Absolute app route. */
  href: string;
  /** Lucide icon component. */
  icon: LucideIcon;
  /** One-line description used in tooltips, command palette, and cards. */
  description: string;
  /** Lifecycle status. */
  status: ModuleStatus;
}

export interface NavSection {
  /** Section label rendered as a small uppercase heading. */
  label: string;
  items: NavItem[];
}

/**
 * The single source of truth for the app's module registry.
 *
 * Adding a module here automatically surfaces it in the sidebar, the command
 * palette, and the dashboard grid. Keep routes in sync with `src/app`.
 */
export const navigation: NavSection[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        description: "Your daily command center at a glance.",
        status: "available",
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        title: "Notes",
        href: "/notes",
        icon: NotebookPen,
        description: "Capture thoughts, ideas, and long-form writing.",
        status: "available",
      },
      {
        title: "Tasks",
        href: "/tasks",
        icon: ListChecks,
        description: "Track to-dos with priorities and due dates.",
        status: "available",
      },
      {
        title: "Goals",
        href: "/goals",
        icon: Target,
        description: "Set outcomes and measure progress over time.",
        status: "planned",
      },
      {
        title: "Projects",
        href: "/projects",
        icon: FolderKanban,
        description: "Organize work into projects and milestones.",
        status: "planned",
      },
      {
        title: "Journal",
        href: "/journal",
        icon: BookOpen,
        description: "Daily entries and reflective writing.",
        status: "planned",
      },
    ],
  },
  {
    label: "Knowledge",
    items: [
      {
        title: "Knowledge Base",
        href: "/knowledge",
        icon: Library,
        description: "A structured wiki for durable knowledge.",
        status: "planned",
      },
      {
        title: "Files",
        href: "/files",
        icon: FolderOpen,
        description: "Store and browse documents and assets.",
        status: "planned",
      },
    ],
  },
  {
    label: "Plan",
    items: [
      {
        title: "Calendar",
        href: "/calendar",
        icon: Calendar,
        description: "See your schedule across every module.",
        status: "planned",
      },
      {
        title: "Habits",
        href: "/habits",
        icon: Activity,
        description: "Build streaks and track daily routines.",
        status: "planned",
      },
      {
        title: "Meetings",
        href: "/meetings",
        icon: Video,
        description: "Notes, agendas, and follow-ups for meetings.",
        status: "planned",
      },
    ],
  },
  {
    label: "Business",
    items: [
      {
        title: "Clients",
        href: "/clients",
        icon: Users,
        description: "Manage relationships and client records.",
        status: "planned",
      },
      {
        title: "Finance",
        href: "/finance",
        icon: CircleDollarSign,
        description: "Track income, expenses, and budgets.",
        status: "planned",
      },
    ],
  },
  {
    label: "Intelligence",
    items: [
      {
        title: "AI Assistant",
        href: "/assistant",
        icon: Bot,
        description: "Ask questions and act across your workspace.",
        status: "planned",
      },
    ],
  },
];

/** Secondary navigation shown at the bottom of the sidebar. */
export const secondaryNavigation: NavItem[] = [
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Preferences, appearance, and account.",
    status: "planned",
  },
];

/** Flattened list of every module, useful for search and the dashboard grid. */
export const allModules: NavItem[] = navigation.flatMap(
  (section) => section.items,
);
