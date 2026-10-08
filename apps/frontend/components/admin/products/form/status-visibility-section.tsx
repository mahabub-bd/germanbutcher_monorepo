"use client";

import { Settings } from "lucide-react";
import type { Control } from "react-hook-form";

import { SectionCard } from "@/components/admin/products/form/section-card";
import {
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import type { ProductFormValues } from "@/utils/product-form-types";

interface StatusVisibilitySectionProps {
  control: Control<ProductFormValues>;
}

export function StatusVisibilitySection({
  control,
}: StatusVisibilitySectionProps) {
  return (
    <SectionCard
      icon={Settings}
      title="Status & Visibility"
      subtitle="Control product availability and placement"
      action={
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
          <FormField
            control={control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  Active Status
                </span>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="Active status"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="isFeatured"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  Featured Product
                </span>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="Featured product"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      }
    />
  );
}
