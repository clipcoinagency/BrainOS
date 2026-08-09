# Roadmap

A living plan for BrainOS. Status reflects the current repository.

Legend: ✅ done · 🚧 in progress · ⬜ planned

## Phase 0 — Foundation ✅

The production-ready base this repo ships today.

- ✅ Next.js 16 (App Router, Turbopack) + TypeScript strict
- ✅ Tailwind v4 + shadcn/ui (Radix) design system, dark-first OKLCH tokens
- ✅ Application shell: responsive sidebar, top bar, mobile drawer
- ✅ Global ⌘K command palette
- ✅ Theme switching (light / dark / system), toasts, tooltips
- ✅ Navigation module registry (single source of truth)
- ✅ Dashboard landing placeholder (hero, stats, module grid)
- ✅ Routable placeholders for all 14 modules + branded 404
- ✅ Providers (TanStack Query SSR-safe, theme)
- ✅ Supabase SSR client scaffolding + Zod-validated env
- ✅ Feature-based architecture + docs (README, architecture, CLAUDE)

## Phase 1 — Platform primitives ⬜

Cross-cutting capabilities every module depends on. Build these before modules.

- ⬜ **Authentication** — Supabase Auth, sign in / up, session `proxy.ts`
      (Next.js 16 renamed `middleware` → `proxy`), protected routes
- ⬜ **Database schema & migrations** — Supabase tables, RLS policies, typed
      client (`supabase gen types`)
- ⬜ **User profile & settings** — build out `/settings`
- ⬜ **Quick Capture** — global capture action (wire the ⌘K / Capture button)
- ⬜ **Global Search** — search across modules
- ⬜ **Command palette actions** — create/act, not just navigate

## Phase 2 — Core workspace modules ⬜

The daily drivers. Suggested delivery order:

1. ⬜ **Notes** — capture, edit, organize
2. ⬜ **Tasks** — priorities, due dates, quick add
3. ⬜ **Projects** — group work, milestones
4. ⬜ **Goals** — outcomes and progress
5. ⬜ **Journal** — daily entries

## Phase 3 — Knowledge & planning ⬜

- ⬜ **Knowledge Base** — structured wiki, linking/backlinks
- ⬜ **Files** — Supabase Storage, upload & browse
- ⬜ **Calendar** — unified schedule across modules
- ⬜ **Habits** — streaks and routines

## Phase 4 — Business & intelligence ⬜

- ⬜ **Clients** — relationship records
- ⬜ **Meetings** — agendas, notes, follow-ups
- ⬜ **Finance** — income, expenses, budgets
- ⬜ **AI Assistant** — question-answering and actions across the workspace

## Phase 5 — Polish & platform ⬜

- ⬜ Real dashboard widgets fed by live data
- ⬜ Notifications system (wire the bell)
- ⬜ Keyboard shortcuts beyond ⌘K
- ⬜ Offline support / PWA
- ⬜ Testing (Vitest + Playwright) and CI
- ⬜ Observability & error tracking

## How to add a module

1. Register it in `src/config/navigation.ts` (set `status`).
2. Create the feature folder `src/features/<module>/` (see its README).
3. Replace the route's `ModulePlaceholder` in `src/app/(app)/<module>/page.tsx`
   with the feature component.
4. Flip `status` to `available` when it ships.
