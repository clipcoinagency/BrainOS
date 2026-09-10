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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Goal } from "@/lib/supabase/types";

import { useUpdateGoal } from "../hooks/use-goals";
import { STATUS_LABEL } from "../lib/progress";
import { goalStatusSchema } from "../schemas";

// The form's own shape: number fields are strings here (that's what native
// number/date inputs yield) and are parsed + range-checked in the submit
// handler before calling the mutation, where `updateGoalSchema` applies.
const numberString = (message: string, allowZero: boolean) =>
  z.string().refine(
    (value) => {
      if (value.trim() === "") return false;
      const n = Number(value);
      return Number.isFinite(n) && (allowZero ? n >= 0 : n > 0);
    },
    { message },
  );

const goalFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(200, "Title is too long."),
  description: z.string().max(5000, "Description is too long."),
  status: goalStatusSchema,
  targetValue: numberString("Enter a number greater than 0.", false),
  currentValue: numberString("Enter a number 0 or greater.", true),
  unit: z.string().trim().max(20, "Unit is too long."),
  targetDate: z.string(),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

interface GoalEditDialogProps {
  goal: Goal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Edit dialog for a goal's title, description, status, progress, unit, and
 * target date. Quick progress steps happen on the card; this is the full
 * explicit-submit form (React Hook Form + Zod).
 */
export function GoalEditDialog({
  goal,
  open,
  onOpenChange,
}: GoalEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit goal</DialogTitle>
        </DialogHeader>
        {goal ? (
          // Keyed by goal id so switching goals REMOUNTS this form with the
          // new goal's data as its initial `defaultValues`, instead of
          // reseeding one long-lived form via an effect (which can only run
          // after the dialog has already painted the previous goal's values).
          <GoalEditForm key={goal.id} goal={goal} onOpenChange={onOpenChange} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function GoalEditForm({
  goal,
  onOpenChange,
}: {
  goal: Goal;
  onOpenChange: (open: boolean) => void;
}) {
  const updateGoal = useUpdateGoal(goal.id);

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: goal.title,
      description: goal.description,
      status: goal.status,
      targetValue: String(goal.target_value),
      currentValue: String(goal.current_value),
      unit: goal.unit,
      targetDate: goal.target_date ?? "",
    },
  });

  function onSubmit(values: GoalFormValues) {
    updateGoal.mutate(
      {
        title: values.title,
        description: values.description,
        status: values.status,
        targetValue: Number(values.targetValue),
        currentValue: Number(values.currentValue),
        unit: values.unit,
        targetDate: values.targetDate === "" ? null : values.targetDate,
      },
      {
        onSuccess: (result) => {
          if ("error" in result) {
            toast.error(result.error);
            return;
          }
          onOpenChange(false);
        },
        onError: () => toast.error("Failed to save goal."),
      },
    );
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
                  placeholder="Why does this matter?"
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
            name="currentValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Progress</FormLabel>
                <FormControl>
                  <Input type="number" inputMode="decimal" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="targetValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target</FormLabel>
                <FormControl>
                  <Input type="number" inputMode="decimal" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="books, km, $…" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="targetDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(
                    Object.keys(STATUS_LABEL) as (keyof typeof STATUS_LABEL)[]
                  ).map((value) => (
                    <SelectItem key={value} value={value}>
                      {STATUS_LABEL[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <Button type="submit" disabled={updateGoal.isPending}>
            {updateGoal.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Save
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
