# Features

This directory holds **feature modules** — the business logic for each part of
BrainOS (Notes, Tasks, Goals, …). It is intentionally empty of implementations
in the foundation; only the convention is defined here.

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
├── api/             # Data access: Supabase queries, server actions
├── lib/             # Pure helpers, mappers, formatting
├── schemas.ts       # Zod schemas (validation + inferred types)
├── types.ts         # Feature-local TypeScript types
└── index.ts         # Public surface — the ONLY thing outside code imports
```

## Rules

1. **Import through the barrel.** Outside code imports from
   `@/features/<feature>` only — never reach into internal files. This keeps a
   feature's public API small and refactors safe.
2. **Routes stay thin.** A `src/app/**/page.tsx` should mostly render a feature
   component and pass route params in.
3. **No cross-feature imports of internals.** If two features need to share
   something, promote it to `src/components`, `src/lib`, or `src/hooks`.
4. **Validate at the boundary.** Parse external/user input with the feature's
   Zod schemas before it enters the rest of the app.

## Example (illustrative — not yet implemented)

```ts
// src/features/notes/index.ts
export { NotesList } from "./components/notes-list";
export { useNotes } from "./hooks/use-notes";
export type { Note } from "./types";
```

```tsx
// src/app/(app)/notes/page.tsx
import { NotesList } from "@/features/notes";

export default function NotesPage() {
  return <NotesList />;
}
```
