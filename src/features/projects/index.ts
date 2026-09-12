/**
 * Public surface of the projects feature.
 *
 * Client-safe: UI components and "use server" actions (safe to import
 * anywhere — Next.js replaces their implementation with an RPC stub in client
 * bundles). Server-only reads live in `./queries` and must be imported from
 * `@/features/projects/queries` in Server Components only.
 */
export { ProjectsView } from "./components/projects-view";
export { ProjectEditor } from "./components/project-editor";
export { MilestoneList } from "./components/milestone-list";
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
