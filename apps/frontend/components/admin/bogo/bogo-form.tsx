"use client";

import { ProductSelector } from "@/components/admin/discount/product-selector";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { applyTime, toTimeInputValue } from "@/utils/datetime";
import { bogoSchema } from "@/utils/form-validation";
import type { Category, BogoCampaign, MinimalProduct } from "@/utils/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  List,
  Box,
  CalendarClock,
  Gift,
  Gauge,
  Loader2,
  Search,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as z from "zod";

interface BogoFormProps {
  campaign?: BogoCampaign;
  mode: "create" | "edit";
  onSuccess: () => void;
}

/** Pseudo-category for the eligible-products picker showing only the
 * products already picked for this campaign. */
const SELECTED_KEY = "selected";

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

export function BogoForm({ campaign, mode, onSuccess }: BogoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    campaign?.products?.length ? SELECTED_KEY : ""
  );
  const [products, setProducts] = useState<MinimalProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [validFromTime, setValidFromTime] = useState(() =>
    campaign?.validFrom ? toTimeInputValue(new Date(campaign.validFrom)) : "00:00"
  );
  const [validUntilTime, setValidUntilTime] = useState(() =>
    campaign?.validUntil ? toTimeInputValue(new Date(campaign.validUntil)) : "23:59"
  );
  type BogoFormValues = z.output<typeof bogoSchema>;

  const form = useForm<BogoFormValues>({
    resolver: zodResolver(bogoSchema) as Resolver<BogoFormValues>,
    defaultValues: {
      name: campaign?.name || "",
      buyQuantity: campaign?.buyQuantity || 2,
      getQuantity: campaign?.getQuantity || 1,
      maxUsage: campaign?.maxUsage || 0,
      validFrom: campaign?.validFrom ? new Date(campaign.validFrom) : undefined,
      validUntil: campaign?.validUntil ? new Date(campaign.validUntil) : undefined,
      isActive: campaign?.isActive ?? true,
      // Map products to productIds for the form
      productIds: campaign?.products
        ? campaign.products.map((item) => item.id)
        : campaign?.productIds || [],
    },
  });

  // Fetch categories for the category-first product picker; seed any already
  // eligible products (edit mode) so their selections survive category switches
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

    if (campaign?.products?.length) {
      setProducts(
        campaign.products.map((item) => ({
          id: item.id,
          name: item.name,
          sellingPrice: Number(item.sellingPrice) || 0,
          discountType: null,
          categoryId: item.category?.id ?? 0,
          categoryName: item.category?.name ?? "",
          attachmentUrl: item.attachment?.url ?? null,
        }))
      );
    }
  }, []);

  // Load the chosen category's products via the minimal products/all endpoint
  useEffect(() => {
    if (!selectedCategoryId || selectedCategoryId === SELECTED_KEY) return;

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

  const onSubmit = async (values: BogoFormValues) => {
    setIsSubmitting(true);
    try {
      // Combine the picked days with the time inputs, then convert to ISO
      const submitData = {
        ...values,
        validFrom: values.validFrom
          ? applyTime(values.validFrom, validFromTime, false).toISOString()
          : undefined,
        validUntil: values.validUntil
          ? applyTime(values.validUntil, validUntilTime, true).toISOString()
          : undefined,
      };

      if (mode === "create") {
        await postData("bogo-campaigns", submitData);
      } else if (mode === "edit" && campaign) {
        await patchData(`bogo-campaigns/${campaign.id}`, submitData);
      }
      onSuccess();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : mode === "create"
            ? "Failed to create campaign"
            : "Failed to update campaign"
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
              {mode === "create" ? "Create BOGO Deal" : "Edit BOGO Deal"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === "create"
                ? "Define a new buy X get Y free deal"
                : "Update the campaign details"}
            </p>
          </div>
        </div>
        <Button className="bg-primaryColor text-white hover:bg-primaryColor/90" asChild>
          <Link href="/admin/marketing/bogo/bogo-list">
            <List className="h-4 w-4 mr-1" />
            Back to BOGO Deals
          </Link>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Basic Info */}
            <section className="rounded-sm border bg-card p-5 space-y-4">
              <SectionTitle icon={Tag} title="Basic Info" />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Buy 2 Get 1 Free — Beef" {...field} />
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
                        Deal applies while active
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

            {/* Deal */}
            <section className="rounded-sm border bg-card p-5 space-y-4">
              <SectionTitle icon={Gift} title="Deal" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="buyQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Buy Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          step="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="getQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Get Free</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          step="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Live preview of the deal */}
              <div className="rounded-lg border border-dashed bg-muted/40 px-3 py-2 text-sm">
                <span className="font-medium text-primaryColor">
                  {(() => {
                    const buy = parseInt(String(form.watch("buyQuantity"))) || 0;
                    const get = parseInt(String(form.watch("getQuantity"))) || 0;
                    if (buy < 1 || get < 1) {
                      return "Set both quantities to preview the deal";
                    }
                    return `Buy ${buy} Get ${get} Free — every group of ${buy + get} eligible units, the ${get} cheapest are free`;
                  })()}
                </span>
              </div>

              <FormField
                control={form.control}
                name="maxUsage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                      Max Usage
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Maximum orders this deal can apply to; 0 = unlimited
                    </p>
                  </FormItem>
                )}
              />
            </section>


            {/* Schedule */}
            <section className="rounded-sm border bg-card p-4 space-y-3 lg:col-span-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  <CalendarClock className="h-3.5 w-3.5" />
                </span>
                <h3 className="text-sm font-semibold">Schedule</h3>
                <span className="text-xs text-muted-foreground truncate">
                  Exact start and end, down to the minute
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="validFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starts</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            className="flex-1"
                          />
                          <Input
                            type="time"
                            value={validFromTime}
                            onChange={(e) => setValidFromTime(e.target.value)}
                            className="flex-1"
                            aria-label="Start time"
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ends</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            minDate={form.watch("validFrom")}
                            className="flex-1"
                          />
                          <Input
                            type="time"
                            value={validUntilTime}
                            onChange={(e) => setValidUntilTime(e.target.value)}
                            className="flex-1"
                            aria-label="End time"
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                A campaign picked to end &quot;today&quot; runs through 23:59 of that day
                unless you set an earlier time.
              </p>
            </section>
          </div>

          {/* Eligible Products */}
          <section className="rounded-sm border bg-card p-5 space-y-2">
            <Accordion
              type="multiple"
              defaultValue={mode === "edit" ? ["products"] : []}
            >
              <AccordionItem value="products" className="border-none">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <Box className="h-4 w-4 text-muted-foreground" />
                    Eligible Products
                    {(form.watch("productIds") || []).length > 0 && (
                      <span className="rounded-full bg-primaryColor/10 px-2 py-0.5 text-xs font-semibold text-primaryColor">
                        {(form.watch("productIds") || []).length}
                      </span>
                    )}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <FormLabel>Category</FormLabel>
                      <Select
                        value={selectedCategoryId}
                        onValueChange={setSelectedCategoryId}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Product category..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={SELECTED_KEY}>
                            {`Selected (${(form.watch("productIds") || []).length
                              })`}
                          </SelectItem>
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
                    </div>
                    <div className="space-y-1.5">
                      {/* Invisible spacer label keeps the search input on
                          the same baseline as the select beside it */}
                      <FormLabel className="invisible">Search</FormLabel>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search products..."
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Only filters the product list — picking here makes
                    individual products eligible
                  </p>

                  <FormField
                    control={form.control}
                    name="productIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ProductSelector
                            products={
                              selectedCategoryId === SELECTED_KEY
                                ? products.filter((p) =>
                                  (field.value || []).includes(p.id)
                                )
                                : selectedCategoryId
                                  ? products.filter(
                                    (p) =>
                                      p.categoryId ===
                                      Number(selectedCategoryId)
                                  )
                                  : []
                            }
                            selectedProductIds={field.value || []}
                            onChange={field.onChange}
                            searchQuery={searchQuery}
                            isLoading={isLoadingProducts}
                            disabled={!selectedCategoryId}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          Selected products are eligible for this BOGO deal —
                          leave empty to apply to the entire store
                        </p>
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          {/* Footer action bar */}
          <div className="rounded-sm border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {(form.watch("productIds") || []).length} product
              {(form.watch("productIds") || []).length !== 1
                ? "s"
                : ""}{" "}
              eligible
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
                {mode === "create" ? "Create BOGO Deal" : "Update BOGO Deal"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
