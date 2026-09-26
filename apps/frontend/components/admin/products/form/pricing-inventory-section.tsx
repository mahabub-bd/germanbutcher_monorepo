"use client";

import { Banknote } from "lucide-react";
import type { Control } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { SectionCard } from "@/components/admin/products/form/section-card";
import type { ProductFormValues } from "@/components/admin/products/form/types";

interface PricingInventorySectionProps {
  control: Control<ProductFormValues>;
}

export function PricingInventorySection({
  control,
}: PricingInventorySectionProps) {
  return (
    <SectionCard icon={Banknote} title="Pricing & Inventory">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <FormField
          control={control}
          name="purchasePrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Purchase Price (৳) <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="0"
                  {...field}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    field.onChange(isNaN(value) ? 0 : value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="sellingPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Sale Price (৳) <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="0"
                  {...field}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    field.onChange(isNaN(value) ? 0 : value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="stock"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Stock Quantity <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input type="number" placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="weight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Weight (gm) <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input type="number" placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </SectionCard>
  );
}
