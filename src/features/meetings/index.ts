/**
 * Public surface of the meetings feature.
 *
 * Client-safe: UI components and "use server" actions (safe to import
 * anywhere — Next.js replaces their implementation with an RPC stub in
 * client bundles). Server-only reads live in `./queries` and must be
 * imported from `@/features/meetings/queries` in Server Components only.
 */
export { MeetingsView } from "./components/meetings-view";
export { MeetingEditor } from "./components/meeting-editor";
export {
  createMeeting,
  updateMeeting,
  deleteMeeting,
  type MeetingResult,
} from "./actions";
export {
  createMeetingSchema,
  updateMeetingSchema,
  type CreateMeetingInput,
  type UpdateMeetingInput,
} from "./schemas";
