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
- ✅ **User profile & settings** — `/settings`: display name (synced to both
      the `profiles` table and Supabase Auth's `user_metadata`, since the
      shell's sidebar/topbar name is read from the latter), theme picker
      (light/dark/system, role="radiogroup" like the Journal mood picker),
      sign out. No new table or migration — reuses `profiles` from Phase 1's
      `init` migration.
- ✅ **Quick Capture** — the topbar Capture button and the palette's "Quick
      capture" item both open one global dialog (⌘Enter to save); content is
      saved as a new note without navigating away, so capturing doesn't
      interrupt whatever page you were on.
- ✅ **Global Search** — `searchWorkspace()` matches titles across notes,
      tasks, goals, and projects, and content for journal entries (which have
      no title), scoped to the signed-in user, 5 results per type. Wired into
      the command palette as a live "Results" group once the query is 2+
      characters. Tasks/goals results link to their list page rather than a
      specific item, since neither has a per-item route yet.
- ✅ **Command palette actions** — "New note", "New project", and "New
      journal entry" create-and-navigate in one step, alongside "Quick
      capture". No equivalent exists yet for tasks/goals (both are created
      via quick-add on their list page, not a blank-item flow).

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
5. ✅ **Journal** — one entry per calendar day (`journal_entries`, unique on
      `(user_id, entry_date)`), "New entry" opens today's entry if it already
      exists rather than erroring on the constraint, mood picker (5 levels,
      immediate save) + content (debounced autosave like Notes), delete
      (confirmed), search. Simplest module yet — a single table, no
      dialog-based editing — but still applied every review lesson learned so
      far from the start: per-entry mutation scoping, list-owned delete
      dialog, local mood state mirrored from the server prop, and
      `lastSavedAt` updated from both the mood and content save paths.

## Phase 3 — Knowledge & planning 🚧

- ✅ **Knowledge Base** — list + editor (`/knowledge`, `/knowledge/[id]`),
      debounced autosave like Notes; `[[Title]]` wiki-links are app-layer, not
      a schema feature — a link is a title substring inside `content`, and
      "linked from" (backlinks) is computed with an ILIKE query at read time
      rather than a separate links table. The editor shows both directions:
      "Links to" resolves this article's own `[[Title]]` references against
      every other article (unresolved titles still show, without a link, so
      the author can see what isn't created yet), "Linked from" lists other
      articles that reference this one. **Known v1 scope limit:** links are
      plain text in the textarea, not rendered inline as clickable text
      while editing (that needs a markdown/wiki preview pane, deferred like
      Notes' own "rich text is a future enhancement").
- ⬜ **Files** — Supabase Storage, upload & browse
- ✅ **Calendar** — month grid (`/calendar?month=YYYY-MM`, prev/next via plain
      links, no client JS needed since navigation is just a URL param) that
      aggregates open task due dates, active goal/project target dates, and
      journal entry days into one view, each item linking back to its own
      module. Reads the other modules' tables directly (scoped to the
      caller), the same cross-module read pattern the search feature already
      established, rather than importing those features' internals. No new
      table. **Known v1 scope limits:** (1) "today" for the default month and
      the today-highlight is computed server-side rather than passed from
      the browser — unlike a *write* path (e.g. journal's create-entry
      date), this is a read-only, low-stakes approximation (worst case: the
      wrong day highlighted, or defaulting to the adjacent month, for a user
      whose local day disagrees with the server's near midnight). (2) A day
      showing more than 3 events caps the display at 3 with a plain "+N
      more" label — there is no day-detail view or popover yet, so the
      overflow items aren't reachable from the calendar itself (only by
      visiting the item's own module directly). Reviewed and fixed:
      unbounded year in the URL month param (now Zod-validated, bounded
      1900–2200 — an out-of-range year could hit JS's legacy two-digit-year
      Date coercion or overflow a 4-digit year string), per-table query
      errors were silently swallowed instead of logged, event type was
      conveyed by color alone with no accessible name, the today cell had no
      `aria-current`/screen-reader label, day cells had no full-date
      `aria-label`, event links were missing `focus-visible` styling and
      `min-w-0` (so a long title could overflow its cell instead of
      ellipsizing), and the page title was static so the route announcer
      never confirmed a month change to screen-reader users.
- ✅ **Habits** — quick add, per-day completion toggle, current streak,
      7-day dot strip; edit dialog (title/description) matching the
      tasks/goals dialog-editing pattern (no dedicated detail route). Two
      tables (`habits` + `habit_logs`, one log row per day), same shape as
      Projects/milestones: a log's `user_id` is denormalized so every table
      keeps the identical RLS policy shape, and the app layer verifies a
      log's `habit_id` belongs to the caller before inserting it (RLS alone
      wouldn't catch a client attaching a log to someone else's habit id).
      Applied the journal feature's timezone lesson from the start: "today"
      for a log is always computed client-side and sent explicitly, bounded
      server-side to within one day of the server's UTC clock.

## Phase 4 — Business & intelligence 🚧

- ✅ **Clients** — quick add, edit dialog (name/company/email/phone/notes,
      keyed-remount RHF+Zod form like tasks/goals/habits), delete
      (confirmed), search. Single table, same RLS pattern as everything
      else. The create action is named `createClientRecord`, not
      `createClient` — the latter collides with Supabase's own client-factory
      helper (`@/lib/supabase/server`), which nearly every other feature's
      `actions.ts` imports under that exact name.
- ✅ **Meetings** — list (`/meetings`, quick create) + detail page
      (`/meetings/[id]`, debounced-autosave title/attendees/notes like Notes,
      immediate-save scheduled time like Projects' target date). Single
      table; `scheduled_at` is the only `timestamptz` column in the schema
      (everywhere else uses a `date`, since those are day-level concepts).
      The `<input type="datetime-local">` control's naive, no-timezone value
      is converted with `new Date(value).toISOString()` in the browser
      before it ever reaches the server — parsing it there instead would
      interpret the same wall-clock string in the server's timezone, not the
      user's, silently shifting the scheduled time.
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
