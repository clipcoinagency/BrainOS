"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Client } from "@/lib/supabase/types";

import {
  createClientRecord,
  deleteClient,
  listClientsAction,
  updateClient,
} from "../actions";
import type { CreateClientInput, UpdateClientInput } from "../schemas";

export const clientKeys = {
  all: ["clients"] as const,
};

/** One TanStack Query mutation `scope` per client, shared by every mutation
 * that writes to it — see the notes feature's `use-notes.ts` for why
 * same-entity writes need to be serialized this way. */
function clientScope(id: string) {
  return { id: `client-${id}` };
}

export function useClientsQuery(initialData: Client[]) {
  return useQuery({
    queryKey: clientKeys.all,
    queryFn: () => listClientsAction(),
    initialData,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateClientInput) => createClientRecord(input),
    onSuccess: (result) => {
      if ("data" in result) {
        queryClient.invalidateQueries({ queryKey: clientKeys.all });
      }
    },
  });
}

export function useUpdateClient(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    scope: clientScope(clientId),
    mutationFn: (input: UpdateClientInput) => updateClient(clientId, input),
    onSuccess: (result) => {
      if ("data" in result) {
        queryClient.invalidateQueries({ queryKey: clientKeys.all });
      }
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: clientKeys.all });
      const previous = queryClient.getQueryData<Client[]>(clientKeys.all);

      queryClient.setQueryData<Client[]>(clientKeys.all, (clients) =>
        clients?.filter((client) => client.id !== id),
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(clientKeys.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}
