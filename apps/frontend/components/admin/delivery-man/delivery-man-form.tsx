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
import { deliveryManSchema } from "@/utils/form-validation";
import type { DeliveryMan } from "@/utils/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { cn } from "@/lib/utils";

interface DeliveryManFormProps {
  deliveryMan?: DeliveryMan;
  mode: "create" | "edit";
  onSuccess: () => void;
}

export function DeliveryManForm({
  deliveryMan,
  mode,
  onSuccess,
}: DeliveryManFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof deliveryManSchema>>({
    resolver: zodResolver(deliveryManSchema),
    defaultValues: {
      name: deliveryMan?.name || "",
      mobileNumber: deliveryMan?.mobileNumber || "+880",
      isActive: deliveryMan?.isActive ?? true,
    },
  });

  const onSubmit = async (values: z.infer<typeof deliveryManSchema>) => {
    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await postData("delivery-man", values);
        toast.success("Delivery man created successfully");
      } else if (mode === "edit" && deliveryMan) {
        await patchData(`delivery-man/${deliveryMan.id}`, values);
        toast.success("Delivery man updated successfully");
      }
      onSuccess();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        (error instanceof Error ? error.message : String(error)) ||
        (mode === "create"
          ? "Failed to create delivery man. Please try again."
          : "Failed to update delivery man. Please try again.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormSection
          title="Delivery person"
          description="Name and mobile number used to reach them."
        >
          <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex h-full flex-col gap-1.5">
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter full name"
                      {...field}
                      className="flex-1"
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
                      placeholder="+880..."
                      {...field}
                      className="flex-1 tabular-nums"
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
          title="Availability"
          description="Controls whether this delivery person can be assigned."
        >
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <SwitchRow
                label="Active"
                hint="Only active delivery people can be assigned to orders"
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
            {mode === "create" ? "Create delivery person" : "Save changes"}
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
