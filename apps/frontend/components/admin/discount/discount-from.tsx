"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  BadgeDollarSign,
  CalendarClock,
  Info,
  Loader2,
  Package,
  Percent,
  Search,
  Store,
  Tag,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { revalidateProducts } from "@/actions/revalidate";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Form,
  FormControl,
  FormDescription,
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
import { patchData } from "@/utils/api-utils";
import { discountFormSchema } from "@/utils/form-validation";
import {
  DiscountType,
  type Category,
  type MinimalProduct,
} from "@/utils/types";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ProductSelector } from "./product-selector";

type DiscountFormValues = z.output<typeof discountFormSchema>;

interface DiscountFormProps {
  mode: "create" | "edit";
  initialProducts?: MinimalProduct[];
  categories?: Category[];
  selectedCategoryId?: string;
  onCategoryChange?: (categoryId: string) => void;
  isLoadingProducts?: boolean;
}

/** Numbered step header shown at the top of each card */
function StepHeader({
  step,
  icon: Icon = Tag,
  title,
  subtitle,
}: {
  step?: number;
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      {step !== undefined ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 text-sm font-semibold">
          {step}
      </span>
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
          <Icon className="h-4.5 w-4.5" />
        </span>
      )}
      <div>
        <h3 className="font-semibold leading-tight">{title}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

export function DiscountForm({
  mode,
  initialProducts = [],
  categories,
  selectedCategoryId,
  onCategoryChange,
  isLoadingProducts = false,
}: DiscountFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm<DiscountFormValues>({
    resolver: zodResolver(discountFormSchema) as Resolver<DiscountFormValues>,
    defaultValues: {
      discountType: DiscountType.PERCENTAGE,
      discountValue: 0,
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
      productIds: [],
    },
  });

  const discountType = form.watch("discountType");
  const discountValue = form.watch("discountValue");
  const selectedProductIds = form.watch("productIds");

  async function onSubmit(data: DiscountFormValues) {
    setIsSubmitting(true);

    try {
      const updatePromises = data.productIds.map((productId) => {
        return patchData(`products/${productId}`, {
          discountType: data.discountType,
          discountValue: data.discountValue,
          discountStartDate: data.startDate.toISOString(),
          discountEndDate: data.endDate.toISOString(),
        });
      });

      await Promise.all(updatePromises);

      // Refresh cached product data on public pages immediately
      await revalidateProducts();

      toast.success(`Discount applied to ${data.productIds.length} products`, {
        description:
          "The selected products have been updated with the new discount",
      });

      router.push("/admin/marketing/discounts/discount-list");
      router.refresh();
    } catch (error) {
      console.error("Error applying discount:", error);
      toast.error("Failed to apply discount", {
        description:
          "There was an error applying the discount. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <Tag className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-2xl font-bold">
              {mode === "create" ? "Create New Discount" : "Edit Discount"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === "create"
                ? "Apply a discount to one or multiple products"
                : "Modify the existing discount settings"}
            </p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/marketing/discounts/discount-list">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Discounts
          </Link>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* 1 — Discount Settings */}
            <section className="rounded-xl border bg-card p-6 space-y-5">
              <StepHeader
                step={1}
                title="Discount Settings"
                subtitle="Choose discount type and set the value"
              />

              <FormField
                control={form.control}
                name="discountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Type</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          {
                            value: DiscountType.PERCENTAGE,
                            label: "Percentage (%)",
                            description: "Discount based on product price",
                            icon: Percent,
                          },
                          {
                            value: DiscountType.FIXED,
                            label: "Fixed Amount",
                            description: "Discount a fixed amount",
                            icon: BadgeDollarSign,
                          },
                        ].map((option) => {
                          const isActive = field.value === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => field.onChange(option.value)}
                              aria-pressed={isActive}
                              className={cn(
                                "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                                isActive
                                  ? "border-red-500 bg-red-50/60"
                                  : "border-border hover:border-red-200"
                              )}
                            >
                              <span
                                className={cn(
                                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                                  isActive
                                    ? "border-red-600"
                                    : "border-muted-foreground/40"
                                )}
                              >
                                {isActive && (
                                  <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                                )}
                              </span>
                              <span
                                className={cn(
                                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                                  isActive
                                    ? "bg-red-100 text-red-600"
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                <option.icon className="h-4.5 w-4.5" />
                              </span>
                              <span>
                                <span className="block text-sm font-medium">
                                  {option.label}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                  {option.description}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Value</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step={
                            discountType === DiscountType.PERCENTAGE
                              ? "1"
                              : "0.01"
                          }
                          min="0"
                          max={
                            discountType === DiscountType.PERCENTAGE
                              ? "100"
                              : undefined
                          }
                          placeholder={
                            discountType === DiscountType.PERCENTAGE
                              ? "10"
                              : "5.99"
                          }
                          {...field}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground text-sm">
                          {discountType === DiscountType.PERCENTAGE
                            ? "%"
                            : "৳"}
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      {discountType === DiscountType.PERCENTAGE
                        ? "Enter a percentage between 1-100"
                        : "Enter the fixed amount to discount"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Discount information note */}
              <div className="flex items-start gap-3 rounded-lg border p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Info className="h-4 w-4" />
                </span>
                <div className="text-sm">
                  <p className="font-medium">Discount Information</p>
                  <p className="text-muted-foreground">
                    {discountType === DiscountType.PERCENTAGE
                      ? "Percentage discounts apply a reduction based on the product's original price."
                      : "Fixed amount discounts subtract a specific amount from the product's original price."}
                  </p>
                </div>
              </div>
            </section>

            <div className="space-y-6">
              {/* 2 — Discount Period */}
              <section className="rounded-xl border bg-card p-6 space-y-5">
                <StepHeader
                  step={2}
                  title="Discount Period"
                  subtitle="Set the start and end date for this discount"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select start date"
                          className="w-full"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select end date"
                          className="w-full"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <CalendarClock className="h-4 w-4" />
                  </span>
                  <div className="text-sm">
                    <p className="font-medium">Date &amp; Time Information</p>
                    <p className="text-muted-foreground">
                      The discount will be active from the start date to the
                      end date (both dates inclusive).
                    </p>
                  </div>
                </div>
              </section>

              {/* 3 — Select Products */}
              <section className="rounded-xl border bg-card p-6 space-y-5">
                <StepHeader
                  step={3}
                  title="Select Products"
                  subtitle="Choose a category and select the products to apply the discount"
                />

                {categories && onCategoryChange && (
                  <div className="space-y-2">
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={selectedCategoryId}
                      onValueChange={onCategoryChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category first..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={String(category.id)}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose a category, then pick the products to discount
                    </FormDescription>
                  </div>
                )}
              </section>
            </div>
          </div>

          {/* Products to Discount */}
          <section className="rounded-xl border bg-card p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <StepHeader
                icon={Package}
                title="Products to Discount"
                subtitle="Select one or multiple products from the list"
              />
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="pl-9"
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="productIds"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ProductSelector
                      products={initialProducts}
                      selectedProductIds={field.value}
                      onChange={field.onChange}
                      searchQuery={searchQuery}
                      isLoading={isLoadingProducts}
                      disabled={!selectedCategoryId}
                      discountType={discountType}
                      discountValue={discountValue}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* Footer action bar */}
          <div className="rounded-xl border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <Store className="h-4.5 w-4.5" />
              </span>
              <p className="text-sm font-medium">
                {selectedProductIds.length} product
                {selectedProductIds.length !== 1 ? "s" : ""} selected
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={selectedProductIds.length === 0}
                onClick={() => form.setValue("productIds", [])}
              >
                Clear Selection
              </Button>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" type="button" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primaryColor hover:bg-primaryColor/90 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Percent className="mr-1 h-4 w-4" />
                    Apply Discount
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
