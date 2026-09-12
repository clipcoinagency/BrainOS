/**
 * Public surface of the journal feature.
 *
 * Client-safe: UI components and "use server" actions (safe to import
 * anywhere — Next.js replaces their implementation with an RPC stub in client
 * bundles). Server-only reads live in `./queries` and must be imported from
 * `@/features/journal/queries` in Server Components only.
 */
export { JournalView } from "./components/journal-view";
export { JournalEntryEditor } from "./components/journal-entry-editor";
export {
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  type JournalResult,
} from "./actions";
export {
  createJournalEntrySchema,
  updateJournalEntrySchema,
  type CreateJournalEntryInput,
  type UpdateJournalEntryInput,
} from "./schemas";
