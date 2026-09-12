/**
 * Public surface of the notes feature.
 *
 * Client-safe: UI components, "use server" actions (safe to import anywhere
 * — Next.js replaces their implementation with an RPC stub in client
 * bundles), and `useCreateNote` — exported specifically so other client
 * surfaces that create a note (e.g. the global command palette, quick
 * capture) go through the same TanStack Query cache-invalidation path as
 * this feature's own UI, instead of calling `createNote` directly and
 * silently leaving the notes list's client-side cache stale. Server-only
 * reads live in `./queries` and must be imported from
 * `@/features/notes/queries` in Server Components only.
 */
export { NotesView } from "./components/notes-view";
export { NoteEditor } from "./components/note-editor";
export { useCreateNote } from "./hooks/use-notes";
export {
  createNote,
  updateNote,
  deleteNote,
  toggleNotePin,
  type NoteResult,
} from "./actions";
export {
  createNoteSchema,
  updateNoteSchema,
  type CreateNoteInput,
  type UpdateNoteInput,
} from "./schemas";
