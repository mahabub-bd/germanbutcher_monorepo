"use client";

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
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { patchData, postData, fetchProtectedData } from "@/utils/api-utils";
import { couponSchema } from "@/utils/form-validation";
import type { Coupon, Product } from "@/utils/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Calendar, DollarSign, Settings, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as z from "zod";

interface CouponFormProps {
  coupon?: Coupon;
  mode: "create" | "edit";
  onSuccess: () => void;
}

export function CouponForm({ coupon, mode, onSuccess }: CouponFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<{ value: number; label: string }[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
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

  // Fetch products for the multi-select
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const response = await fetchProtectedData("products");
        const productList = (response as Product[]).map((product) => ({
          value: product.id,
          label: product.name,
        }));
        setProducts(productList);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

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
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 bg-white rounded-md shadow-sm"
      >
        <div className="grid gap-5 p-4 md:p-6">
          {/* Basic Information */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm uppercase tracking-wide">
                Basic Info
              </h3>
            </div>
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
          </section>

          <Separator />

          {/* Discount Configuration */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm uppercase tracking-wide">
                Discount Config
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <FormField
                control={form.control}
                name="discountType"
                render={({ field }) => (
                  <FormItem className="w-full">
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
                  <FormItem className="w-full">
                    <FormLabel>
                      {form.watch("discountType") === "percentage"
                        ? "Discount (%)"
                        : "Discount (৳)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="w-full"
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
                  <FormItem className="w-full">
                    <FormLabel>Min Order (৳)</FormLabel>
                    <FormControl>
                      <Input
                        className="w-full"
                        type="number"
                        step="0.01"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseFloat(e.target.value) : null
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
                    <FormItem className="w-full">
                      <FormLabel>Max Discount (৳)</FormLabel>
                      <FormControl>
                        <Input
                          className="w-full"
                          type="number"
                          step="0.01"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : null
                            )
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ) : (
                <div className="FormItem w-full">
                  <FormLabel>Max Discount (৳)</FormLabel>
                  <div className="text-sm text-muted-foreground italic">
                    N/A for fixed
                  </div>
                </div>
              )}
            </div>
          </section>

          <Separator />

          {/* Validity */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm uppercase tracking-wide">
                Validity
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <Separator />

          {/* Usage Settings */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm uppercase tracking-wide">
                Usage Settings
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <FormLabel className="text-sm font-medium">
                        Active Status
                      </FormLabel>
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
          </section>

          <Separator />

          {/* Excluded Products */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Box className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm uppercase tracking-wide">
                Excluded Products
              </h3>
            </div>

            <FormField
              control={form.control}
              name="excludedItemIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Products to Exclude from Discount</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={products}
                      selected={field.value || []}
                      onChange={field.onChange}
                      placeholder="Select products to exclude..."
                      disabled={isLoadingProducts}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Select products that should not receive this discount
                  </p>
                </FormItem>
              )}
            />
          </section>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t bg-muted/40">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <span className="mr-2 h-4 w-4 animate-spin">⏳</span>
            )}
            {mode === "create" ? "Create" : "Update"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
