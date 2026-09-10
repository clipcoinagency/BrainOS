/**
 * Public surface of the goals feature.
 *
 * Client-safe: UI components and "use server" actions (safe to import
 * anywhere — Next.js replaces their implementation with an RPC stub in client
 * bundles). Server-only reads live in `./queries` and must be imported from
 * `@/features/goals/queries` in Server Components only.
 */
export { GoalsView } from "./components/goals-view";
export {
  createGoal,
  updateGoal,
  updateGoalProgress,
  deleteGoal,
  type GoalResult,
} from "./actions";
export {
  createGoalSchema,
  updateGoalSchema,
  goalStatusSchema,
  type CreateGoalInput,
  type UpdateGoalInput,
  type GoalStatus,
} from "./schemas";
