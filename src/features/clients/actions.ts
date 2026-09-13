"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { requireUser } from "@/lib/supabase/require-user";
import type { Client } from "@/lib/supabase/types";

import { createClientSchema, updateClientSchema } from "./schemas";
import type { CreateClientInput, UpdateClientInput } from "./schemas";
import { listClients } from "./queries";

/** Discriminated result returned to the client. */
export type ClientResult<T> = { data: T } | { error: string };

const NOT_FOUND = "Client not found.";

// `id` always originates from a route param or another action's own return
// value, but these are Server Actions — reachable by any authenticated
// browser via devtools or a hand-crafted request, not just through our UI.
const clientIdSchema = z.string().uuid();

function revalidateClients() {
  revalidatePath("/clients");
}

/** List the current user's clients. A "use server" bridge over
 * `queries.listClients` so Client Components (e.g. a TanStack Query
 * `queryFn`) can call it — direct imports of `queries.ts` are blocked by its
 * `server-only` guard. */
export async function listClientsAction(): Promise<Client[]> {
  return listClients();
}

/** Create a client.
 *
 * Named `createClientRecord`, not `createClient` — the latter is the name
 * of Supabase's own client-factory helper (`@/lib/supabase/server` and
 * `@/lib/supabase/client`), imported by nearly every other feature's
 * actions.ts. Reusing it here for an unrelated "Client" (a CRM contact)
 * would collide the instant both are imported in the same file. */
export async function createClientRecord(
  input: CreateClientInput,
): Promise<ClientResult<Client>> {
  const ctx = await requireUser("Clients");
  if ("error" in ctx) return { error: ctx.error };

  const parsed = createClientSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Please check the client and try again.",
    };
  }

  const { supabase, user } = ctx;
  const { data, error } = await supabase
    .from("clients")
    .insert({ user_id: user.id, name: parsed.data.name })
    .select()
    .single();

  if (error || !data) return { error: "Failed to create client." };

  revalidateClients();
  return { data };
}

/** Update a client's fields. */
export async function updateClient(
  id: string,
  input: UpdateClientInput,
): Promise<ClientResult<Client>> {
  if (!clientIdSchema.safeParse(id).success) return { error: NOT_FOUND };

  const ctx = await requireUser("Clients");
  if ("error" in ctx) return { error: ctx.error };

  const parsed = updateClientSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Please check the client and try again.",
    };
  }

  const { name, company, email, phone, notes } = parsed.data;
  if (
    name === undefined &&
    company === undefined &&
    email === undefined &&
    phone === undefined &&
    notes === undefined
  ) {
    return { error: "Nothing to update." };
  }

  const { supabase, user } = ctx;
  const { data, error } = await supabase
    .from("clients")
    .update({
      ...(name !== undefined && { name }),
      ...(company !== undefined && { company }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(notes !== undefined && { notes }),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !data) return { error: "Failed to update client." };

  revalidateClients();
  return { data };
}

/** Delete a client. */
export async function deleteClient(
  id: string,
): Promise<ClientResult<{ id: string }>> {
  if (!clientIdSchema.safeParse(id).success) return { error: NOT_FOUND };

  const ctx = await requireUser("Clients");
  if ("error" in ctx) return { error: ctx.error };

  const { supabase, user } = ctx;
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "Failed to delete client." };

  revalidateClients();
  return { data: { id } };
}
