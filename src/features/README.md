# Features

This directory holds **feature modules** — the business logic for each part of
BrainOS (Notes, Tasks, Goals, …).

## Why feature-based?

Grouping code by feature (not by technical type) keeps everything a feature
needs in one place, makes ownership obvious, and lets features grow or be
removed without touching unrelated code. `src/app` stays a thin routing layer
that composes features.

## Anatomy of a feature

```
src/features/<feature>/
├── components/      # UI specific to this feature
├── hooks/           # React hooks (data + behavior) for this feature
├── actions.ts        # "use server" mutations — safe to import from client code
├── queries.ts         # server-only reads — import ONLY from Server Components
├── schemas.ts       # Zod schemas (validation + inferred types)
├── types.ts         # Feature-local TypeScript types (if not derived from schemas.ts)
└── index.ts         # Public surface — the barrel outside code imports
```

## Rules

1. **Import through the barrel** (`@/features/<feature>`) — with two deliberate
   exceptions imported by submodule path: `./actions` (server actions; safe
   anywhere) and `./queries` (server-only; Server Components only). See
   [`auth`](auth) and [`notes`](notes) for both patterns in practice.
2. **Routes stay thin.** A `src/app/**/page.tsx` should mostly render a feature
   component and pass route params in.
3. **No cross-feature imports of internals** (components/hooks/lib). If two
   features need to share something, promote it to `src/components`, `src/lib`,
   or `src/hooks`.
4. **Validate at the boundary.** Parse external/user input with the feature's
   Zod schemas before it enters the rest of the app.

## Reference implementation: Notes

[`src/features/notes`](notes) is the first fully-built feature and the pattern
every module after it should follow:

- **`schemas.ts`** — `createNoteSchema` / `updateNoteSchema` (Zod), camelCase
  field names (`isPinned`) even where the DB column is snake_case (`is_pinned`)
  — the action layer maps between them.
- **`queries.ts`** — `server-only`, wrapped in React's `cache()` so a page and
  its `generateMetadata` share one fetch. Never throws; degrades to an empty
  result if Supabase is unreachable or unconfigured.
- **`actions.ts`** — `"use server"` mutations (`createNote`, `updateNote`,
  `deleteNote`, `toggleNotePin`), each re-validated with Zod, scoped to
  `auth.uid()` via an explicit `.eq("user_id", user.id)` (defense-in-depth
  alongside RLS), and calling `revalidatePath` after writing. Also re-exports
  the query functions as server actions (`listNotesAction`, `getNoteAction`) so
  Client Components can call them (a Client Component cannot import a
  `server-only` file directly).
- **`hooks/use-notes.ts`** — TanStack Query wrapping the actions: `useQuery`
  seeded with `initialData` from the Server Component (no loading flash), and
  `useMutation`s with optimistic updates for pin/delete. **Mutations that write
  to the same entity share a `scope: { id: "note-<id>" }`** — TanStack Query
  serializes same-scope mutations, so a slow autosave can never complete after
  a newer one and revert the row, and rapid double-clicks (e.g. a pin toggle)
  can't land out of order. Any module with per-row edits (autosave, toggles)
  should copy this pattern.
- **`components/`** — `NotesView` (list, search, empty states) and
  `NoteEditor` (debounced autosave), each a thin composition of `components/ui`
  primitives plus this feature's hooks. **Keyed lists that reorder by state**
  (e.g. pinned-first) render from **one sorted array under one parent**, not
  separate arrays under separate containers — React only preserves a
  component's identity (and DOM focus) across a reorder within the same
  parent; splitting "pinned" and "the rest" into two `.map()`s under two
  `<div>`s makes every pin toggle unmount and remount the card. **A
  confirmation dialog for deleting a list item lives one level up, in the list,
  not inside the item being deleted** — an optimistic delete removes the item
  (and anything mounted inside it, including an open dialog) the instant it's
  confirmed, so a dialog owned by the item can't outlive its own confirmation.
- The matching migration is
  [`supabase/migrations/20260907000001_notes.sql`](../../supabase/migrations/20260907000001_notes.sql) —
  RLS enabled immediately, policies scoped to `auth.uid()`, an `updated_at`
  trigger reused from the `profiles` migration.

When building a new module, copying this file-by-file is usually the fastest
correct start.
