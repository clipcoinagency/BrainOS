/**
 * Public surface of the tasks feature.
 *
 * Client-safe: UI components and "use server" actions (safe to import
 * anywhere — Next.js replaces their implementation with an RPC stub in client
 * bundles). Server-only reads live in `./queries` and must be imported from
 * `@/features/tasks/queries` in Server Components only.
 */
export { TasksView } from "./components/tasks-view";
export {
  createTask,
  updateTask,
  deleteTask,
  toggleTaskComplete,
  type TaskResult,
} from "./actions";
export {
  createTaskSchema,
  updateTaskSchema,
  taskPrioritySchema,
  type CreateTaskInput,
  type UpdateTaskInput,
  type TaskPriority,
} from "./schemas";
