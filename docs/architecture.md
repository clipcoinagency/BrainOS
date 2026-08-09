# Architecture

This document describes how BrainOS is structured and the reasoning behind the
key decisions. It is the map; [`CLAUDE.md`](../CLAUDE.md) is the rulebook.

## Goals

BrainOS is designed to grow into a large, multi-module product. The
architecture optimizes for:

1. **Scalability** — adding a module must not require touching unrelated code.
2. **Locality** — everything a feature needs lives together.
3. **Thin routing** — `src/app` composes features; it doesn't own logic.
4. **Type safety** — mistakes are caught at compile time, not runtime.
5. **A calm, consistent UI** — one design system, dark-first.

## High-level layers

```
┌─────────────────────────────────────────────────────────┐
│  app/            Routing & composition (thin)            │
├─────────────────────────────────────────────────────────┤
│  features/       Business logic, grouped by domain       │
├─────────────────────────────────────────────────────────┤
│  components/     Design system (ui) + shell + shared     │
│  providers/      Cross-cutting client context            │
│  hooks/ lib/     Reusable behavior & utilities           │
│  config/ types/  Static configuration & shared types     │
└─────────────────────────────────────────────────────────┘
```

Dependencies point **downward only**. Features may use `components`, `hooks`,
`lib`, `config`, and `types`. Nothing in those lower layers imports from
`features` or `app`.

## Routing (`src/app`)

We use the **Next.js App Router**.

- **Route group `(app)`** wraps every signed-in view in the application shell
  (`app/(app)/layout.tsx`) without adding a URL segment. So the dashboard is
  `/dashboard`, not `/app/dashboard`.
- **The root `/`** (`app/page.tsx`) redirects to `/dashboard`. This is the seam
  where a signed-out marketing page and auth routing will branch later.
- **Module routes** (`/notes`, `/tasks`, …) currently render a shared
  `ModulePlaceholder`. As modules are built, each `page.tsx` becomes a thin
  wrapper around a feature component.
- **`not-found.tsx`** provides a branded 404 rendered by the root layout.

### Server vs. Client Components

Server Components are the default. A component becomes a Client Component
(`"use client"`) only when it needs interactivity, browser APIs, or React
state/effects — e.g. the sidebar (active-route highlighting), theme toggle, and
command palette. Data fetching for pages prefers the server; client-side
fetching uses TanStack Query.

> **Next.js 16 note:** request APIs (`cookies()`, `headers()`, `params`,
> `searchParams`) are **async**. Turbopack is the default bundler. Route prop
> types `PageProps<'/route'>` / `LayoutProps<'/route'>` are generated globals.

## Feature modules (`src/features`)

Business logic is grouped by **feature**, not by technical type. Each feature is
self-contained and exposes a small public API through an `index.ts` barrel.
Outside code imports only from `@/features/<feature>`. See
[`src/features/README.md`](../src/features/README.md) for the full convention.

This is the single most important rule for keeping a large app maintainable:
**features are black boxes with a documented surface.**

## Design system (`src/components`)

- **`components/ui`** — [shadcn/ui](https://ui.shadcn.com) primitives (Radix
  under the hood). These are owned, in-repo, and editable. Generated via the
  shadcn CLI (`radix-nova` style).
- **`components/layout`** — the application shell: `app-sidebar`,
  `sidebar-nav`, `app-topbar`, `mobile-nav`, `command-menu`, `theme-toggle`,
  `user-menu`.
- **`components/shared`** — reusable app-level building blocks: `logo`,
  `page-header`, `empty-state`, `module-card`, `stat-card`,
  `module-placeholder`.

### Theming & tokens

Colors live in `src/app/globals.css` as **OKLCH** CSS variables, exposed to
Tailwind v4 through `@theme inline`. `:root` is the light theme; `.dark`
(toggled by `next-themes`) is the reference, **dark-first** theme.

Surfaces stay near-neutral (a Linear/Vercel canvas); a single **indigo brand
accent** (`--brand`) drives primary actions, active navigation, focus rings, and
the logo. Change the brand by editing the `--brand` / `--primary` / `--ring`
tokens in one place.

## Navigation as data (`src/config/navigation.ts`)

The sidebar, command palette, and dashboard grid are all rendered from a single
**module registry**. Each entry has a `title`, `href`, `icon`, `description`,
and `status` (`available` | `planned`). Adding a module there surfaces it
everywhere automatically and keeps the roadmap and UI in sync.

## Providers (`src/providers`)

Client context is composed once in `providers/index.tsx` and mounted in the root
layout:

- **ThemeProvider** (`next-themes`) — dark-first, class strategy, system option.
- **QueryProvider** (TanStack Query) — SSR-safe client singleton, sensible
  defaults, devtools in development.
- **TooltipProvider** and **Toaster** (Sonner).

## Data layer

### Supabase (`src/lib/supabase`)

Two client factories using `@supabase/ssr`:

- **`client.ts`** — `createClient()` for Client Components (browser).
- **`server.ts`** — async `createClient()` for Server Components, Route
  Handlers, and Server Actions (reads cookies via the async `cookies()` API).

Both throw a clear error if Supabase env vars are missing, and callers can gate
on `isSupabaseConfigured` so the app runs unconfigured.

### Environment (`src/lib/env.ts`)

Environment variables are parsed and validated with **Zod** at module load.
Only `NEXT_PUBLIC_*` variables are referenced (statically, by full name, so
Next.js can inline them). Invalid values fail fast with a readable error.

### Fetching strategy

- **Server-owned data** → fetch in Server Components / Server Actions.
- **Client-owned, interactive data** → TanStack Query hooks inside features.
- **Mutations** → Server Actions or feature `api/` functions, then invalidate
  the relevant query keys.

## Forms & validation

React Hook Form for state/UX, Zod for schema + inferred types, wired with
`@hookform/resolvers`. A feature's `schemas.ts` is the source of truth for both
validation and its TypeScript types (`z.infer`). Validate at every boundary
(forms, route handlers, external data).

## Accessibility & responsiveness

- Semantic landmarks (`nav`, `main`, `header`), `aria-current` on active links,
  labelled icon-only buttons, visible focus rings, and a `sr-only` logo label.
- Radix primitives provide keyboard and screen-reader behavior for overlays.
- Mobile-first layout: the sidebar collapses into a drawer below `lg`.

## Build & tooling

- **Turbopack** for dev and build (Next.js 16 default).
- **TypeScript strict** mode; route types generated on dev/build.
- **ESLint** flat config (`eslint-config-next`); **Prettier** for formatting.
- Production build statically prerenders all foundation routes.
