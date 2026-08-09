/**
 * Global, framework-agnostic metadata for the application.
 *
 * Keep this file free of React/Next imports so it can be consumed from
 * anywhere (server components, client components, route handlers, scripts).
 */
export const siteConfig = {
  name: "BrainOS",
  shortName: "BrainOS",
  description:
    "BrainOS is a personal operating system for your work and life — notes, tasks, goals, knowledge, and more in one calm, fast workspace.",
  url: "https://brainos.local",
  ogImage: "/og.png",
  creator: "BrainOS",
  keywords: [
    "personal knowledge management",
    "productivity",
    "second brain",
    "notes",
    "tasks",
    "goals",
  ],
  links: {
    // Fill these in as the project grows.
    docs: "/docs",
  },
} as const;

export type SiteConfig = typeof siteConfig;
