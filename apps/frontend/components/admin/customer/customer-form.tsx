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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { fetchProtectedData, patchData, postData } from "@/utils/api-utils";
import { userSchema } from "@/utils/form-validation";
import { Role, User } from "@/utils/types";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface UserFormProps {
  user?: User;
  mode: "create" | "edit";
  onSuccess: () => void;
}

export function CustomerForm({ user, mode, onSuccess }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",

      mobileNumber: user?.mobileNumber || "+880",
      roleId: user?.role?.id.toString(),
      isVerified: user?.isVerified || false,
    },
  });
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetchProtectedData<Role[]>("roles");

        setRoles(response);
      } catch (error) {
        console.error("Error fetching units:", error);
      }
    };

    fetchRoles();
  }, []);

  const onSubmit = async (values: z.infer<typeof userSchema>) => {
    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await postData("users", values);
      } else if (mode === "edit" && user) {
        const payload = { ...values };

        await patchData(`users/${user.id}`, payload);
      }
      onSuccess();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        mode === "create"
          ? "Failed to create user. Please try again."
          : "Failed to update user. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormSection
          title="Customer"
          description="Name, email and mobile number for this customer."
        >
          <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex h-full flex-col gap-1.5">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter name"
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
              name="email"
              render={({ field }) => (
                <FormItem className="flex h-full flex-col gap-1.5">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter email"
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
              name="mobileNumber"
              render={({ field }) => (
                <FormItem className="flex h-full flex-col gap-1.5">
                  <FormLabel>Mobile number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+880"
                      {...field}
                      className="w-full"
                      onChange={(e) => {
                        const input = e.target.value.replace(/[^0-9+]/g, "");
                        if (!input.startsWith("+880")) {
                          field.onChange(
                            `+880${input.replace(/^\+?880?/, "")}`
                          );
                        } else {
                          field.onChange(input);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        <FormSection
          title="Access"
          description="Assigned role and verification status."
        >
          <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem className="flex h-full flex-col gap-1.5">
                  <FormLabel>Role</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={mode === "edit"}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles?.map((role: Role) => (
                        <SelectItem
                          className=" capitalize"
                          key={role.id}
                          value={role.id.toString()}
                        >
                          {role?.rolename}
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
              name="isVerified"
              render={({ field }) => (
                <SwitchRow
                  label="Verified"
                  hint="Customer account is verified"
                  checked={field.value}
                  onChange={field.onChange}
                  className="h-full"
                />
              )}
            />
          </div>
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
            {mode === "create" ? "Create customer" : "Save changes"}
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
