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

## Phase 1 — Platform primitives 🚧

Cross-cutting capabilities every module depends on. Build these before modules.

- ✅ **Authentication** — Supabase Auth: `/login` + `/signup` (RHF + Zod +
      server actions), `/auth/callback` code exchange, sign-out, session refresh
      and route protection via `proxy.ts` (Next.js 16 renamed `middleware` →
      `proxy`). Open-redirect-hardened; runs in guest mode until configured.
- ✅ **Database schema & migrations** — `profiles` table with RLS, owner-scoped
      policies, `updated_at` + `handle_new_user` triggers; typed `Database`
      client; `supabase/README.md` setup guide.
- ⬜ **User profile & settings** — build out `/settings`
- ⬜ **Quick Capture** — global capture action (wire the ⌘K / Capture button)
- ⬜ **Global Search** — search across modules
- ⬜ **Command palette actions** — create/act, not just navigate

## Phase 2 — Core workspace modules 🚧

The daily drivers. Suggested delivery order:

1. ✅ **Notes** — list + editor (`/notes`, `/notes/[id]`), create, autosave
      (debounced, per-note write-serialized), pin, delete (confirmed,
      accessible), client-side search; `notes` table with RLS; TanStack Query
      over Server Actions — the **reference implementation** for every module
      after it (see [`src/features/notes`](../src/features/notes) and its
      [README](../src/features/README.md)). Reviewed for security,
      correctness, and accessibility; 10 issues found and fixed (raced
      autosave writes, a pin-toggle race, a delete dialog that could unmount
      mid-confirmation, keyboard-focus-visibility, screen-reader labels, and
      more). Plain text for v1; rich text/markdown is a future enhancement.
      **Known, accepted gap:** returning to `/notes` after deleting a note from
      the editor doesn't move focus to the list — fixing it well requires
      distinguishing that navigation from an ordinary visit to `/notes` (e.g. a
      sidebar click), which unconditional focus-on-mount would break instead.
2. ✅ **Tasks** — quick add, priority, due dates, completion toggle, edit
      dialog (first use of the `Form` + `Select` primitives with React Hook
      Form), delete (confirmed), search; `tasks` table with RLS. Applied every
      Notes-review lesson from the start (per-task mutation scoping, single
      reconciled list, list-owned delete dialog). Reviewed; 3 fixes (quick-add
      focus loss, edit-dialog stale-data flash, a missing screen-reader label)
      plus 2 correctly-identified false positives.
3. ✅ **Goals** — quick add, current/target progress with inline +/− steppers,
      status (active / achieved / archived), unit + target date, edit dialog,
      delete (confirmed), search; `goals` table with RLS. Same patterns as
      Tasks. Built before Projects at the user's request.
4. ✅ **Projects** — list (`/projects`, quick add, search, status) + detail
      page (`/projects/[id]`, debounced-autosave title/description like
      Notes, immediate-save status/target date) with a milestone checklist
      (quick add, toggle, delete — no confirmation on milestones, unlike
      every primary entity elsewhere, since they're small and trivially
      re-added). First two-table feature: `projects` + `project_milestones`,
      each with the same simple `auth.uid() = user_id` RLS policy (milestones
      carry their own denormalized `user_id` rather than a join/EXISTS policy
      against `projects`) — the app layer still verifies a milestone's
      `project_id` actually belongs to the caller before insert, since RLS
      alone wouldn't catch a client attaching a milestone to someone else's
      project id. Applied every prior lesson from the start, including one
      found while building it: a status `<Select>`/date `<Input>` bound
      directly to the Server Component's `project` prop instead of local
      state — the prop only refreshes on a full page reload, so the control
      would silently reflect the *pre-change* value after a successful save.
      Preceded by extracting a shared `requireUser()` helper (`src/lib/
      supabase/require-user.ts`) — Notes/Tasks/Goals each had a byte-for-byte
      copy; Projects made it the 4th.
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
