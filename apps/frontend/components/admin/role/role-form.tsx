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
import { Textarea } from "@/components/ui/textarea";
import { patchData, postData } from "@/utils/api-utils";
import { roleSchema } from "@/utils/form-validation";
import { Role } from "@/utils/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";





interface RoleFormProps {
  role?: Role;
  mode: "create" | "edit";
  onSuccess: () => void;
}

export function RoleForm({ role, mode, onSuccess }: RoleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof roleSchema>>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      rolename: role?.rolename || "",
      description: role?.description || "",
      isActive: role?.isActive ?? true,
    },
  });

  const onSubmit = async (values: z.infer<typeof roleSchema>) => {
    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await postData("roles", values);
        toast.success("Role created successfully");
      } else if (mode === "edit" && role) {
        await patchData(`roles/${role.id}`, values);
        toast.success("Role updated successfully");
      }
      onSuccess();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        mode === "create"
          ? "Failed to create role. Please try again."
          : "Failed to update role. Please try again."
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
            name="rolename"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Role Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter role name"
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
            name="description"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter role description"
                    {...field}
                    className="w-full min-h-[100px]"
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
            {mode === "create" ? "Create Role" : "Update Role"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
