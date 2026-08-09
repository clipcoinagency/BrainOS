/**
 * Shared, app-wide types.
 *
 * Feature-specific types live inside each feature folder
 * (`src/features/<feature>/types.ts`). Keep this file for primitives that are
 * genuinely cross-cutting.
 */

/** A component that accepts and renders children. */
export interface WithChildren {
  children: React.ReactNode;
}

/** Utility: make selected keys of T optional. */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Standard async data state, useful for client-side fetching UIs. */
export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };
