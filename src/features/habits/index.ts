/**
 * Public surface of the habits feature.
 *
 * Client-safe: UI components and "use server" actions (safe to import
 * anywhere — Next.js replaces their implementation with an RPC stub in
 * client bundles). Server-only reads live in `./queries` and must be
 * imported from `@/features/habits/queries` in Server Components only.
 */
export { HabitsView } from "./components/habits-view";
export {
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabitLog,
  type HabitResult,
} from "./actions";
export {
  createHabitSchema,
  updateHabitSchema,
  type CreateHabitInput,
  type UpdateHabitInput,
} from "./schemas";
