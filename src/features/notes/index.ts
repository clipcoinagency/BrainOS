/**
 * Public surface of the notes feature.
 *
 * Client-safe: UI components and "use server" actions (safe to import
 * anywhere — Next.js replaces their implementation with an RPC stub in client
 * bundles). Server-only reads live in `./queries` and must be imported from
 * `@/features/notes/queries` in Server Components only.
 */
export { NotesView } from "./components/notes-view";
export { NoteEditor } from "./components/note-editor";
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
