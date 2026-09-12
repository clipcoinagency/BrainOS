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
import type { HabitWithLogs } from "../queries";

import { useUpdateHabit } from "../hooks/use-habits";

const habitFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(200, "Title is too long."),
  description: z.string().max(2000, "Description is too long."),
});

type HabitFormValues = z.infer<typeof habitFormSchema>;

interface HabitEditDialogProps {
  habit: HabitWithLogs | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Edit dialog for a habit's title and description. Completion is toggled
 * from the card itself, and delete lives in the card's menu — this dialog
 * is purely the editable fields, in an explicit-submit form (React Hook
 * Form + Zod) rather than autosave, matching the tasks/goals edit dialogs.
 */
export function HabitEditDialog({
  habit,
  open,
  onOpenChange,
}: HabitEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit habit</DialogTitle>
        </DialogHeader>
        {habit ? (
          // Keyed by habit id so switching habits REMOUNTS this form with
          // the new habit's data as its initial `defaultValues` — see the
          // tasks feature's TaskEditDialog for why (avoids a one-frame flash
          // of the previous habit's stale data on every reopen).
          <HabitEditForm
            key={habit.id}
            habit={habit}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function HabitEditForm({
  habit,
  onOpenChange,
}: {
  habit: HabitWithLogs;
  onOpenChange: (open: boolean) => void;
}) {
  const updateHabit = useUpdateHabit(habit.id);

  const form = useForm<HabitFormValues>({
    resolver: zodResolver(habitFormSchema),
    defaultValues: {
      title: habit.title,
      description: habit.description,
    },
  });

  function onSubmit(values: HabitFormValues) {
    updateHabit.mutate(values, {
      onSuccess: (result) => {
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        onOpenChange(false);
      },
      onError: () => toast.error("Failed to save habit."),
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="What does success look like?"
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
          <Button type="submit" disabled={updateHabit.isPending}>
            {updateHabit.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Save
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
