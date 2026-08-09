# CLAUDE.md — BrainOS engineering standards

> This file guides both humans and AI assistants working in this repo. Every
> change should follow these standards so the codebase stays coherent as it
> grows. Read [`docs/architecture.md`](docs/architecture.md) for the "why".

@AGENTS.md

<!--
  The line above imports the Next.js version-matched agent rules (managed by
  `next dev`). Next.js 16 differs from older versions — always heed those rules
  and the bundled docs in node_modules/next/dist/docs/ before writing Next code.
-->

## 0. Golden rules

1. **Thin routes, fat features.** Logic lives in `src/features/*`, not in
   `src/app/*`. Pages compose features.
2. **Server-first.** Prefer Server Components. Add `"use client"` only when you
   need state, effects, browser APIs, or event handlers.
3. **Type everything.** No `any`. Derive types from Zod schemas where possible.
4. **One design system.** Use `components/ui` primitives and design tokens —
   never hard-coded colors or ad-hoc spacing systems.
5. **Import through barrels.** Consume features via `@/features/<feature>` only.

## 1. Tech stack (do not swap without discussion)

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript (strict) · Tailwind
CSS v4 · shadcn/ui (Radix) · Supabase (`@supabase/ssr`) · TanStack Query ·
React Hook Form · Zod · Lucide · next-themes · Sonner.

## 2. Folder conventions

```
src/
├── app/            # Routes only. Thin. (app) route group = signed-in shell.
├── features/       # Business logic by domain. Public API via index.ts.
├── components/
│   ├── ui/         # shadcn primitives (generated; editable).
│   ├── layout/     # App shell (sidebar, topbar, command menu…).
│   └── shared/     # Reusable cross-feature app components.
├── config/         # Static config (site, navigation registry).
├── hooks/          # Reusable, cross-feature hooks.
├── lib/            # Utilities, env, supabase clients. Framework-light.
├── providers/      # Client context providers.
└── types/          # Cross-cutting shared types.
```

**Where does code go?**

- Used by one feature → inside that feature.
- Used by many features → `components/shared`, `hooks`, or `lib`.
- A design primitive → `components/ui` (via shadcn CLI).
- Pure route wiring → `app`.

### Feature module layout

```
src/features/<feature>/
├── components/  hooks/  api/  lib/
├── schemas.ts   types.ts
└── index.ts     # the ONLY public surface
```

Never import a feature's internal files from outside it. Cross-feature sharing
gets promoted up a layer.

## 3. Naming conventions

| Thing                     | Convention             | Example                       |
| ------------------------- | ---------------------- | ----------------------------- |
| Files & folders           | `kebab-case`           | `module-card.tsx`, `use-media-query.ts` |
| React components          | `PascalCase`           | `ModuleCard`, `AppTopbar`     |
| Component files           | `kebab-case.tsx`       | `app-topbar.tsx`              |
| Hooks                     | `useX` in `use-x.ts`   | `useMounted` → `use-mounted.ts` |
| Variables & functions     | `camelCase`            | `createClient`, `allModules`  |
| Types & interfaces        | `PascalCase`           | `NavItem`, `AsyncState`       |
| Constants (module-level)  | `camelCase` / `UPPER`  | `siteConfig`, `COMMAND_MENU_EVENT` |
| Zod schemas               | `xSchema`              | `noteSchema`                  |
| Env vars (browser)        | `NEXT_PUBLIC_*`        | `NEXT_PUBLIC_SUPABASE_URL`    |
| Routes / segments         | `kebab-case`           | `/knowledge`, `/ai-assistant` |

Prefer named exports. Default exports only where the framework requires them
(`page.tsx`, `layout.tsx`, `not-found.tsx`, etc.).

## 4. TypeScript

- `strict` is on. Don't disable checks; fix the types.
- No `any`. Use `unknown` + narrowing, or a precise type.
- Derive types from a single source: `type Note = z.infer<typeof noteSchema>`.
- Use `import type { … }` for type-only imports.
- Type route props with the generated helpers: `PageProps<'/route'>`,
  `LayoutProps<'/route'>` (available after `next dev`/`build`/`typegen`).

## 5. React & Next.js

- **Server Components by default.** `"use client"` is a deliberate, minimal
  choice pushed as far down the tree as possible.
- Request APIs are **async** in Next 16: `await cookies()`, `await headers()`,
  `await params`, `await searchParams`.
- Navigate with `<Link>`; use `useRouter` only for programmatic cases.
- Fetch server-owned data on the server; use TanStack Query for client-owned,
  interactive data. Invalidate query keys after mutations.
- Keep `page.tsx` small — render a feature component and pass params in.
- Network boundary logic goes in `proxy.ts` (Next 16 renamed `middleware`).

## 6. Styling & UI principles

- **Dark-first.** Design for dark, verify light. `.dark` is the reference.
- **Tokens only.** Use semantic classes (`bg-background`, `text-muted-foreground`,
  `border`, `bg-brand`). Never hard-code hex/oklch in components. Adjust the
  palette in `globals.css`.
- **Compose with `cn()`** (`@/lib/utils`) for conditional classes.
- **Spacing & radius** follow the Tailwind scale and the `--radius` token.
- **Consistency over cleverness.** Reuse `PageHeader`, `EmptyState`,
  `ModuleCard`, `StatCard` rather than one-off layouts.
- **Motion is subtle.** Short, purposeful transitions; respect reduced motion.
- **Icons:** Lucide, sized in `rem`/`size-*`, marked `aria-hidden` when decorative.

### Accessibility (non-negotiable)

- Use semantic elements and landmarks. Label every icon-only control
  (`aria-label`). Mark active nav with `aria-current="page"`.
- Keep visible focus states (`focus-visible:ring-*`). Don't remove outlines.
- Prefer Radix primitives for overlays (keyboard + SR behavior built in).
- Maintain sufficient color contrast in both themes.

## 7. Data, env & security

- Validate all external input (forms, route handlers, API responses) with Zod
  at the boundary.
- Access env only through `@/lib/env`. Never read `process.env` directly in
  feature code. Only `NEXT_PUBLIC_*` is available in the browser.
- Never commit secrets. `.env.local` is git-ignored; keep `.env.example` current.
- Gate DB features on `isSupabaseConfigured`. Enforce Row Level Security in
  Supabase; never trust the client.
- Don't leak server-only values into Client Components.

## 8. State management

- **Server state** → TanStack Query (single source of truth for remote data).
- **URL state** → search params (shareable, back-button friendly).
- **Local UI state** → `useState`/`useReducer`, kept local.
- **Global client state** → a provider in `src/providers` (add sparingly).
- Avoid ad-hoc global stores; reach for them only when genuinely shared.

## 9. Quality bar (before you're "done")

- `npm run typecheck` — clean.
- `npm run lint` — clean.
- `npm run build` — succeeds.
- New UI verified in **both** light and dark, and at mobile + desktop widths.
- New user input is Zod-validated and accessible (keyboard + labels).

## 10. Adding a module (checklist)

1. Add/inspect the entry in `src/config/navigation.ts` (`status`).
2. Scaffold `src/features/<module>/` with the standard layout + `index.ts`.
3. Define `schemas.ts` (Zod) and derive `types.ts` from it.
4. Build data access in `api/`, UI in `components/`, behavior in `hooks/`.
5. Swap the route's `ModulePlaceholder` for the feature component.
6. Flip `status` to `available`; update [`docs/roadmap.md`](docs/roadmap.md).

## 11. Commit hygiene

- Small, focused commits with imperative messages
  (`feat(notes): add note editor`). Conventional-commit prefixes encouraged
  (`feat`, `fix`, `refactor`, `docs`, `chore`, `test`).
- Keep unrelated changes out of a PR. Update docs alongside behavior changes.
