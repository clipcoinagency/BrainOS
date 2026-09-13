"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Client } from "@/lib/supabase/types";

import { useClientsQuery, useCreateClient } from "../hooks/use-clients";
import { ClientCard } from "./client-card";
import { ClientEditDialog } from "./client-edit-dialog";
import { DeleteClientDialog } from "./delete-client-dialog";

export function ClientsView({ initialClients }: { initialClients: Client[] }) {
  const [query, setQuery] = useState("");
  const [quickAdd, setQuickAdd] = useState("");
  const { data: clients } = useClientsQuery(initialClients);
  const createClient = useCreateClient();

  // Lifted here (not inside ClientCard) for the same reason as tasks/goals/
  // habits: an optimistic delete removes the client — and its card — from
  // this list the instant it's confirmed, so a dialog owned by the card
  // can't outlive its own confirmation.
  const [editTarget, setEditTarget] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(q) ||
        client.company.toLowerCase().includes(q) ||
        client.email.toLowerCase().includes(q),
    );
  }, [clients, query]);

  function handleQuickAdd(event: React.FormEvent) {
    event.preventDefault();
    const name = quickAdd.trim();
    if (!name) return;

    createClient.mutate(
      { name },
      {
        onSuccess: (result) => {
          if ("error" in result) {
            toast.error(result.error);
            return;
          }
          setQuickAdd("");
        },
        onError: () => toast.error("Failed to create client."),
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Manage relationships and client records."
      />

      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <Input
          value={quickAdd}
          onChange={(event) => setQuickAdd(event.target.value)}
          placeholder="Add a client and press Enter…"
          aria-label="New client name"
        />
        <Button
          type="submit"
          disabled={createClient.isPending || !quickAdd.trim()}
        >
          {createClient.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Add
        </Button>
      </form>

      {clients.length > 0 ? (
        <div className="relative max-w-sm">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search clients…"
            className="pl-8"
            aria-label="Search clients"
          />
        </div>
      ) : null}

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client above to start tracking relationships."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching clients"
          description={`Nothing matches "${query}". Try a different search.`}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={setEditTarget}
              onRequestDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <ClientEditDialog
        client={editTarget}
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      />

      <DeleteClientDialog
        clientId={deleteTarget?.id ?? ""}
        clientName={deleteTarget?.name.trim() ?? ""}
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
