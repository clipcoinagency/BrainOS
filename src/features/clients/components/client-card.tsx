"use client";

import { Mail, MoreHorizontal, Phone, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { Client } from "@/lib/supabase/types";

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onRequestDelete: (client: Client) => void;
}

export function ClientCard({
  client,
  onEdit,
  onRequestDelete,
}: ClientCardProps) {
  return (
    <div className="group hover:border-brand/40 relative flex flex-col gap-2 rounded-xl border p-4 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => onEdit(client)}
          aria-label={`Edit "${client.name}"`}
          className="focus-visible:ring-ring min-w-0 flex-1 rounded text-left focus-visible:ring-2 focus-visible:outline-none"
        >
          <h3 className="truncate text-sm font-medium" aria-hidden>
            {client.name}
          </h3>
          {client.company ? (
            <p className="text-muted-foreground truncate text-xs" aria-hidden>
              {client.company}
            </p>
          ) : null}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Client actions"
              className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 has-data-[state=open]:opacity-100"
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onRequestDelete(client)}
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {client.email || client.phone ? (
        <div className="text-muted-foreground flex flex-col gap-1 text-xs">
          {client.email ? (
            <span className="flex items-center gap-1.5 truncate">
              <Mail className="size-3.5 shrink-0" aria-hidden="true" />
              {client.email}
            </span>
          ) : null}
          {client.phone ? (
            <span className="flex items-center gap-1.5 truncate">
              <Phone className="size-3.5 shrink-0" aria-hidden="true" />
              {client.phone}
            </span>
          ) : null}
        </div>
      ) : null}

      {client.notes.trim() ? (
        <p className="text-muted-foreground line-clamp-2 text-xs text-pretty whitespace-pre-line">
          {client.notes.trim()}
        </p>
      ) : null}
    </div>
  );
}
