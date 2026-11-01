"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { patchData, postData } from "@/utils/api-utils";
import { Unit } from "@/utils/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const unitSchema = z.object({
  name: z.string().min(1, "Unit name is required"),
  isActive: z.boolean(),
});

interface UnitFormProps {
  unit?: Unit;
  mode: "create" | "edit";
  onSuccess: () => void;
  /** Leave without saving. Falls back to onSuccess when omitted. */
  onCancel?: () => void;
}

export function UnitForm({ unit, mode, onSuccess, onCancel }: UnitFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof unitSchema>>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      name: unit?.name || "",
      isActive: unit?.isActive ?? true,
    },
  });

  const onSubmit = async (values: z.infer<typeof unitSchema>) => {
    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await postData("units", values);
        toast.success("Unit created successfully");
      } else if (mode === "edit" && unit) {
        await patchData(`units/${unit.id}`, values);
        toast.success("Unit updated successfully");
      }
      onSuccess();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        mode === "create"
          ? "Failed to create unit. Please try again."
          : "Failed to update unit. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>Unit name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Kilogram, Piece, Litre"
                    {...field}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <div
                onClick={() => field.onChange(!field.value)}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border bg-background p-3 transition-colors hover:border-primary/40 hover:bg-muted/30"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs leading-snug text-muted-foreground">
                    Offered on products and shown in the unit dropdown
                  </p>
                </div>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  onClick={(event) => event.stopPropagation()}
                  className="shrink-0"
                />
              </div>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel ?? onSuccess}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create unit" : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
