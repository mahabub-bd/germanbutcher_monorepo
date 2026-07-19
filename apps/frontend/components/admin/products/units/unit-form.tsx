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
}

export function UnitForm({ unit, mode, onSuccess }: UnitFormProps) {
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Unit Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter unit name (e.g., Kilogram, Piece)"
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
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 space-y-0">
                <div className="space-y-0.5">
                  <FormLabel>Active Status</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-4 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            disabled={isSubmitting}
            className="w-24"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-32">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create Unit" : "Update Unit"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
