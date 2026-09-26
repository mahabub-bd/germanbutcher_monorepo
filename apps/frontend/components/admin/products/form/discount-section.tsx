"use client";

import { Tags } from "lucide-react";
import { useWatch, type Control } from "react-hook-form";

import { SectionCard } from "@/components/admin/products/form/section-card";
import type { ProductFormValues } from "@/components/admin/products/form/types";
import { DatePicker } from "@/components/ui/date-picker";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrencyEnglish } from "@/lib/utils";
import { DiscountType } from "@/utils/types";

interface DiscountSectionProps {
  control: Control<ProductFormValues>;
}

export function DiscountSection({ control }: DiscountSectionProps) {
  const hasDiscount = useWatch({ control, name: "hasDiscount" });
  const watchedSellingPrice = useWatch({ control, name: "sellingPrice" });
  const watchedDiscountType = useWatch({ control, name: "discountType" });
  const watchedDiscountValue = useWatch({ control, name: "discountValue" });

  const showPreview =
    hasDiscount && watchedSellingPrice > 0 && (watchedDiscountValue ?? 0) > 0;

  const discountValue = watchedDiscountValue ?? 0;
  const discountedPrice = showPreview
    ? watchedDiscountType === DiscountType.FIXED
      ? Math.max(0, watchedSellingPrice - discountValue)
      : Math.max(0, watchedSellingPrice * (1 - discountValue / 100))
    : 0;
  const discountPercent = showPreview
    ? Math.round(((watchedSellingPrice - discountedPrice) / watchedSellingPrice) * 100)
    : 0;

  return (
    <SectionCard
      icon={Tags}
      title="Discount"
      subtitle="Optional temporary price reduction"
      className={
        hasDiscount ? "border-red-200 bg-red-50/40 dark:border-red-900/50 dark:bg-red-950/20" : undefined
      }
      action={
        <FormField
          control={control}
          name="hasDiscount"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <span className="text-xs text-muted-foreground">
                Apply Discount
              </span>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label="Apply discount"
                />
              </FormControl>
            </FormItem>
          )}
        />
      }
      headerCenter={
        showPreview ? (
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 rounded-lg border border-red-200 bg-white/70 px-3 py-1.5 text-xs dark:border-red-900/50 dark:bg-transparent">
            <span className="font-medium">Preview:</span>
            <span className="text-muted-foreground">Original Price</span>
            <span className="text-muted-foreground line-through">
              {formatCurrencyEnglish(watchedSellingPrice)}
            </span>
            <span className="text-red-600 dark:text-red-400">→</span>
            <span className="text-red-600 dark:text-red-400">
              Discounted Price{" "}
              <strong>{formatCurrencyEnglish(discountedPrice)}</strong>
            </span>
            <span className="rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
              {discountPercent}% OFF
            </span>
          </div>
        ) : undefined
      }
    >
      {hasDiscount && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <FormField
              control={control}
              name="discountType"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Discount Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select discount type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={DiscountType.PERCENTAGE}>
                        Percentage (%)
                      </SelectItem>
                      <SelectItem value={DiscountType.FIXED}>
                        Fixed Amount
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="discountValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Discount Value{" "}
                    {watchedDiscountType === DiscountType.FIXED ? "(৳)" : "(%)"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter discount amount"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="discountStartDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select start date"
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="discountEndDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select End date"
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </>
      )}
    </SectionCard>
  );
}
