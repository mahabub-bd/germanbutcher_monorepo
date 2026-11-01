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

import { cn } from "@/lib/utils";





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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormSection
          title="Role"
          description="The role name and what it is used for."
        >
          <FormField
            control={form.control}
            name="rolename"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>Role name</FormLabel>
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
              <FormItem className="space-y-1.5">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter role description"
                    {...field}
                    className="min-h-20 resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection
          title="Visibility"
          description="Whether this role can currently be assigned."
        >
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <SwitchRow
                label="Active"
                hint="Role can be assigned to users"
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </FormSection>

        <div className="sticky bottom-2 flex flex-col-reverse items-stretch gap-2 rounded-lg border bg-card/95 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create role" : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

/** Bordered card with a titled header — shared admin form convention. */
function FormSection({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-lg border bg-card shadow-xs",
        className
      )}
    >
      <div className="border-b px-3.5 py-2.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex-1 space-y-3 p-3.5">{children}</div>
    </section>
  );
}

/** Clickable full-width toggle row. */
function SwitchRow({
  label,
  hint,
  checked,
  onChange,
  className,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  className?: string;
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={cn(
        "flex cursor-pointer items-center justify-between gap-3 rounded-lg border bg-background p-3 transition-colors hover:border-primary/40 hover:bg-muted/30",
        className
      )}
    >
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs leading-snug text-muted-foreground">{hint}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        onClick={(event) => event.stopPropagation()}
        className="shrink-0"
      />
    </div>
  );
}
