"use client";

import { ProductSelector } from "@/components/admin/discount/product-selector";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
import {
  fetchData,
  fetchDataPagination,
  patchData,
  postData,
} from "@/utils/api-utils";
import { couponSchema } from "@/utils/form-validation";
import type { Category, Coupon, MinimalProduct } from "@/utils/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Box,
  Calendar,
  DollarSign,
  Loader2,
  Search,
  Settings,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as z from "zod";

interface CouponFormProps {
  coupon?: Coupon;
  mode: "create" | "edit";
  onSuccess: () => void;
}

/** Section header with a red icon tile */
function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
        <Icon className="h-4 w-4" />
      </span>
      <h3 className="font-semibold">{title}</h3>
    </div>
  );
}

export function CouponForm({ coupon, mode, onSuccess }: CouponFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [products, setProducts] = useState<MinimalProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  type CouponFormValues = z.output<typeof couponSchema>;

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema) as Resolver<CouponFormValues>,
    defaultValues: {
      code: coupon?.code || "",
      discountType: coupon?.discountType || "percentage",
      value: coupon?.value ? Number(coupon.value) : 0,
      maxUsage: coupon?.maxUsage || 100,
      validFrom: coupon?.validFrom ? new Date(coupon.validFrom) : undefined,
      validUntil: coupon?.validUntil ? new Date(coupon.validUntil) : undefined,
      isActive: coupon?.isActive ?? true,
      maxDiscountAmount: coupon?.maxDiscountAmount
        ? Number(coupon.maxDiscountAmount)
        : null,
      minOrderAmount: coupon?.minOrderAmount
        ? Number(coupon.minOrderAmount)
        : null,
      // Map excludedItems to excludedItemIds for the form
      excludedItemIds: coupon?.excludedItems
        ? coupon.excludedItems.map((item) => item.id)
        : coupon?.excludedItemIds || [],
    },
  });

  // Fetch categories for the category-first product picker; seed any already
  // excluded items (edit mode) so their selections survive category switches
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetchDataPagination<{
          data: Category[];
        }>("categories");
        if (Array.isArray(response.data)) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();

    if (coupon?.excludedItems?.length) {
      setProducts(
        coupon.excludedItems.map((item) => ({
          id: item.id,
          name: item.name,
          sellingPrice: item.sellingPrice ?? 0,
          discountType: item.discountType ?? null,
          categoryId: item.category?.id ?? 0,
          categoryName: item.category?.name ?? "",
        }))
      );
    }
  }, []);

  // Load the chosen category's products via the minimal products/all endpoint
  useEffect(() => {
    if (!selectedCategoryId) return;

    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const fetched = await fetchData<MinimalProduct[]>(
          `products/all?category=${selectedCategoryId}&isActive=true`
        );
        if (Array.isArray(fetched)) {
          // Merge by id so selections survive switching between categories
          setProducts((prev) => {
            const byId = new Map(prev.map((p) => [p.id, p]));
            fetched.forEach((p) => byId.set(p.id, p));
            return [...byId.values()].sort((a, b) =>
              a.name.localeCompare(b.name)
            );
          });
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [selectedCategoryId]);

  const onSubmit = async (values: CouponFormValues) => {
    setIsSubmitting(true);
    try {
      // Convert Date objects to ISO strings for API
      const submitData = {
        ...values,
        validFrom: values.validFrom ? values.validFrom.toISOString() : undefined,
        validUntil: values.validUntil ? values.validUntil.toISOString() : undefined,
      };

      if (mode === "create") {
        await postData("coupons", submitData);
      } else if (mode === "edit" && coupon) {
        await patchData(`coupons/${coupon.id}`, submitData);
      }
      onSuccess();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : mode === "create"
            ? "Failed to create coupon"
            : "Failed to update coupon"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
              {mode === "create" ? "Create Coupon" : "Edit Coupon"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === "create"
                ? "Define a new discount coupon"
                : "Update the coupon details"}
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/marketing/coupon/coupon-list">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Coupons
          </Link>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Basic Info */}
            <section className="rounded-xl border bg-card p-5 space-y-4">
              <SectionTitle icon={Tag} title="Basic Info" />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coupon Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. SUMMER20"
                        {...field}
                        className="uppercase"
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
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel className="text-sm font-medium">
                        Active Status
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Coupon can be used while active
                      </p>
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
            </section>

            {/* Discount Config */}
            <section className="rounded-xl border bg-card p-5 space-y-4">
              <SectionTitle icon={DollarSign} title="Discount Config" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="discountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">
                              Percentage (%)
                            </SelectItem>
                            <SelectItem value="fixed">Fixed (৳)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {form.watch("discountType") === "percentage"
                          ? "Discount (%)"
                          : "Discount (৳)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step={
                            form.watch("discountType") === "percentage"
                              ? "1"
                              : "0.01"
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minOrderAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Order (৳)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : null
                            )
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("discountType") === "percentage" ? (
                  <FormField
                    control={form.control}
                    name="maxDiscountAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Discount (৳)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : null
                              )
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="space-y-2">
                    <FormLabel>Max Discount (৳)</FormLabel>
                    <div className="text-sm text-muted-foreground italic">
                      N/A for fixed
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Validity */}
            <section className="rounded-xl border bg-card p-5 space-y-4">
              <SectionTitle icon={Calendar} title="Validity" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="validFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          minDate={form.watch("validFrom")}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {/* Usage Settings */}
            <section className="rounded-xl border bg-card p-5 space-y-4">
              <SectionTitle icon={Settings} title="Usage Settings" />

              <FormField
                control={form.control}
                name="maxUsage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Usage</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Total number of times this coupon can be used
                    </p>
                  </FormItem>
                )}
              />
            </section>
          </div>

          {/* Excluded Products */}
          <section className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <SectionTitle icon={Box} title="Excluded Products" />
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

            <div className="space-y-2">
              <FormLabel>Category</FormLabel>
              <Select
                value={selectedCategoryId}
                onValueChange={setSelectedCategoryId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category first..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose a category, then pick the products to exclude
              </p>
            </div>

            <FormField
              control={form.control}
              name="excludedItemIds"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ProductSelector
                      products={products}
                      selectedProductIds={field.value || []}
                      onChange={field.onChange}
                      searchQuery={searchQuery}
                      isLoading={isLoadingProducts}
                      disabled={!selectedCategoryId}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Selected products will not receive this coupon's discount
                  </p>
                </FormItem>
              )}
            />
          </section>

          {/* Footer action bar */}
          <div className="rounded-xl border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {(form.watch("excludedItemIds") || []).length} product
              {(form.watch("excludedItemIds") || []).length !== 1
                ? "s"
                : ""}{" "}
              excluded
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onSuccess}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primaryColor hover:bg-primaryColor/90 text-white"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {mode === "create" ? "Create Coupon" : "Update Coupon"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
