/**
 * Public surface of the clients feature.
 *
 * Client-safe: UI components and "use server" actions (safe to import
 * anywhere — Next.js replaces their implementation with an RPC stub in
 * client bundles). Server-only reads live in `./queries` and must be
 * imported from `@/features/clients/queries` in Server Components only.
 */
export { ClientsView } from "./components/clients-view";
export {
  createClientRecord,
  updateClient,
  deleteClient,
  type ClientResult,
} from "./actions";
export {
  createClientSchema,
  updateClientSchema,
  type CreateClientInput,
  type UpdateClientInput,
} from "./schemas";
