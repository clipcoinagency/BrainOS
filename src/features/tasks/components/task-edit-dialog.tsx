"use client";

import { useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Task } from "@/lib/supabase/types";

import { useUpdateTask } from "../hooks/use-tasks";
import { PRIORITY_LABEL } from "../lib/priority";
import { taskPrioritySchema } from "../schemas";

// The form's own shape, distinct from `updateTaskSchema`: a native
// `<input type="date">` always yields "" or "YYYY-MM-DD", never `null` — the
// submit handler below maps "" to `null` (clear the due date) when calling
// the mutation, which is where the real `updateTaskSchema` applies.
const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(200, "Title is too long."),
  description: z.string().max(5000, "Description is too long."),
  priority: taskPrioritySchema,
  dueDate: z.string(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskEditDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Edit dialog for a task's title, description, priority, and due date.
 * Completion is toggled from the list row itself, and delete lives in the
 * row's menu — this dialog is purely the editable fields, kept in an
 * explicit-submit form (React Hook Form + Zod) rather than autosave, since
 * several fields typically change together here.
 */
export function TaskEditDialog({
  task,
  open,
  onOpenChange,
}: TaskEditDialogProps) {
  // A stable id keeps the mutation's TanStack Query scope from changing while
  // the dialog is closing (task becomes null); the hook itself is only ever
  // invoked while a real task is open.
  const updateTask = useUpdateTask(task?.id ?? "");

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "none",
      dueDate: "",
    },
  });

  // Re-seed the form whenever a different task opens.
  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.due_date ?? "",
      });
    }
  }, [task, form]);

  function onSubmit(values: TaskFormValues) {
    if (!task) return;

    updateTask.mutate(
      {
        title: values.title,
        description: values.description,
        priority: values.priority,
        dueDate: values.dueDate === "" ? null : values.dueDate,
      },
      {
        onSuccess: (result) => {
          if ("error" in result) {
            toast.error(result.error);
            return;
          }
          onOpenChange(false);
        },
        onError: () => toast.error("Failed to save task."),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
        </DialogHeader>

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
                      placeholder="Add details…"
                      className="min-h-20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(
                          Object.keys(
                            PRIORITY_LABEL,
                          ) as (keyof typeof PRIORITY_LABEL)[]
                        ).map((value) => (
                          <SelectItem key={value} value={value}>
                            {PRIORITY_LABEL[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateTask.isPending}>
                {updateTask.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
