/**
 * Public surface of the projects feature.
 *
 * Client-safe: UI components, "use server" actions (safe to import anywhere
 * — Next.js replaces their implementation with an RPC stub in client
 * bundles), and `useCreateProject` — exported specifically so other client
 * surfaces that create a project (e.g. the global command palette) go
 * through the same TanStack Query cache-invalidation path as this feature's
 * own UI, instead of calling `createProject` directly and silently leaving
 * the projects list's client-side cache stale. Server-only reads live in
 * `./queries` and must be imported from `@/features/projects/queries` in
 * Server Components only.
 */
export { ProjectsView } from "./components/projects-view";
export { ProjectEditor } from "./components/project-editor";
export { MilestoneList } from "./components/milestone-list";
export { useCreateProject } from "./hooks/use-projects";
export {
  createProject,
  updateProject,
  deleteProject,
  createMilestone,
  toggleMilestoneComplete,
  deleteMilestone,
  type ProjectResult,
} from "./actions";
export {
  createProjectSchema,
  updateProjectSchema,
  createMilestoneSchema,
  projectStatusSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
  type CreateMilestoneInput,
  type ProjectStatus,
} from "./schemas";
