"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Client } from "@/lib/supabase/types";

import { useUpdateClient } from "../hooks/use-clients";

const clientFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(200, "Name is too long."),
  company: z.string().max(200, "Company is too long."),
  email: z.union([
    z.literal(""),
    z.string().trim().email("Enter a valid email."),
  ]),
  phone: z.string().max(50, "Phone is too long."),
  notes: z.string().max(5000, "Notes are too long."),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientEditDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Edit dialog for a client's fields. Delete lives in the card's menu — this
 * dialog is purely the editable fields, in an explicit-submit form (React
 * Hook Form + Zod) rather than autosave, matching the tasks/goals/habits
 * edit dialogs.
 */
export function ClientEditDialog({
  client,
  open,
  onOpenChange,
}: ClientEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit client</DialogTitle>
        </DialogHeader>
        {client ? (
          // Keyed by client id so switching clients REMOUNTS this form with
          // the new client's data as its initial `defaultValues` — see the
          // tasks feature's TaskEditDialog for why (avoids a one-frame flash
          // of the previous client's stale data on every reopen).
          <ClientEditForm
            key={client.id}
            client={client}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ClientEditForm({
  client,
  onOpenChange,
}: {
  client: Client;
  onOpenChange: (open: boolean) => void;
}) {
  const updateClient = useUpdateClient(client.id);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      notes: client.notes,
    },
  });

  function onSubmit(values: ClientFormValues) {
    updateClient.mutate(values, {
      onSuccess: (result) => {
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        onOpenChange(false);
      },
      onError: () => toast.error("Failed to save client."),
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input type="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Add details…"
                  className="min-h-20"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateClient.isPending}>
            {updateClient.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Save
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
