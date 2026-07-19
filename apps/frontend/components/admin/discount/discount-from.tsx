"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { formatCurrencyEnglish } from "@/lib/utils";
import { patchData } from "@/utils/api-utils";
import { discountFormSchema } from "@/utils/form-validation";
import { DiscountType, type Product } from "@/utils/types";
import Link from "next/link";
import { InfoBox, Section } from "../helper";
import { ProductSelector } from "./product-selector";

type DiscountFormValues = z.output<typeof discountFormSchema>;

interface DiscountFormProps {
  mode: "create" | "edit";
  initialProducts?: Product[];
}

export function DiscountForm({
  mode,
  initialProducts = [],
}: DiscountFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const selectedProductIds = form.watch("productIds");
  const selectedProducts = initialProducts.filter((product) =>
    selectedProductIds.includes(product.id)
  );

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
    <div className="md:p-6 p:2 space-y-6 border rounded-sm">
      <div className="md:p-6 p:2">
        <div className="flex justify-between items-center mb-6">
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
          <Button asChild variant="outline">
            <Link href="/admin/marketing/discounts/discount-list">
              Back to Discounts
            </Link>
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="p-6 space-y-6">
              <Section title="Discount Settings">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="discountType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Discount Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem
                                  value={DiscountType.PERCENTAGE}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Percentage (%)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value={DiscountType.FIXED} />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Fixed Amount
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
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
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                              {discountType === DiscountType.PERCENTAGE
                                ? "%"
                                : "$"}
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
                </div>

                <InfoBox
                  title="Discount Information"
                  description={
                    discountType === DiscountType.PERCENTAGE
                      ? "Percentage discounts apply a reduction based on the product's original price."
                      : "Fixed amount discounts subtract a specific dollar value from the product's original price."
                  }
                />
              </Section>

              <Section title="Discount Period">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          placeholder="Select start date"
                          className="w-full"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Section>

              <Section title="Select Products">
                <FormField
                  control={form.control}
                  name="productIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Products to Discount</FormLabel>
                      <FormControl>
                        <ProductSelector
                          products={initialProducts}
                          selectedProductIds={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>
                        {selectedProductIds.length === 0
                          ? "Select products to apply the discount to"
                          : `${selectedProductIds.length} product${
                              selectedProductIds.length > 1 ? "s" : ""
                            } selected`}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Section>

              {selectedProducts.length > 0 && (
                <Section title="Preview">
                  <div className="border rounded-md overflow-hidden">
                    <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 text-xs font-medium">
                      <div>Product</div>
                      <div>Original Price</div>
                      <div>Discounted Price</div>
                    </div>
                    <Separator />
                    <div className="max-h-50 overflow-y-auto">
                      {selectedProducts.map((product) => {
                        const discountValue =
                          form.getValues("discountValue") || 0;
                        const discountType = form.getValues("discountType");

                        let discountedPrice = product.sellingPrice;
                        if (discountType === DiscountType.PERCENTAGE) {
                          discountedPrice =
                            product.sellingPrice * (1 - discountValue / 100);
                        } else {
                          discountedPrice = Math.max(
                            0,
                            product.sellingPrice - discountValue
                          );
                        }

                        return (
                          <div
                            key={product.id}
                            className="grid grid-cols-3 gap-4 p-3 text-sm border-t first:border-0"
                          >
                            <div className="font-medium truncate">
                              {product.name}
                            </div>
                            <div>
                              {formatCurrencyEnglish(product.sellingPrice)}
                            </div>
                            <div className="text-green-600 font-medium">
                              {formatCurrencyEnglish(discountedPrice)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Section>
              )}
            </div>

            <div className="flex justify-end p-6 border-t">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    "Apply Discount"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
