/**
 * Public surface of the journal feature.
 *
 * Client-safe: UI components, "use server" actions (safe to import anywhere
 * — Next.js replaces their implementation with an RPC stub in client
 * bundles), and `useCreateJournalEntry` — exported specifically so other
 * client surfaces that create an entry (e.g. the global command palette) go
 * through the same TanStack Query cache-invalidation path as this feature's
 * own UI, instead of calling `createJournalEntry` directly and silently
 * leaving the journal list's client-side cache stale. Server-only reads
 * live in `./queries` and must be imported from `@/features/journal/queries`
 * in Server Components only.
 */
export { JournalView } from "./components/journal-view";
export { JournalEntryEditor } from "./components/journal-entry-editor";
export { useCreateJournalEntry } from "./hooks/use-journal";
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
