"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Banknote,
  Building2,
  ClipboardList,
  Clock,
  FileText,
  Hash,
  Loader2,
  Package,
  Plus,
  ShoppingCart,
  StickyNote,
  Trash2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type Resolver, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
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
import { SectionCard } from "@/components/admin/products/form/section-card";

import { DatePicker } from "@/components/ui/date-picker";
import { fetchProtectedData, patchData, postData } from "@/utils/api-utils";
import { purchaseSchema } from "@/utils/form-validation";
import type { Product, Purchase, Supplier } from "@/utils/types";
import { LoadingIndicator } from "../../loading-indicator";

type PurchaseFormValues = z.output<typeof purchaseSchema>;

interface PurchaseFormProps {
  mode: "create" | "edit";
  purchase?: Purchase;
}

export function PurchaseForm({ mode, purchase }: PurchaseFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number>();
  const [isProductsLoading, setIsProductsLoading] = useState(false);

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema) as Resolver<PurchaseFormValues>,
    defaultValues: {
      supplierId: purchase?.supplier?.id || undefined,
      items: purchase?.items?.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.product.purchasePrice,
      })) || [{ productId: undefined, quantity: 1, unitPrice: 0 }],
      purchaseDate: purchase?.purchaseDate
        ? new Date(purchase.purchaseDate)
        : new Date(),
      status:
        (purchase?.status as
          | "pending"
          | "shipped"
          | "delivered"
          | "cancelled") || "pending",
      notes: purchase?.notes || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const suppliers = await fetchProtectedData<Supplier[]>("suppliers");
        setSuppliers(suppliers);

        if (purchase?.supplier?.id) {
          setIsProductsLoading(true);
          const supplierProducts = await fetchProtectedData<Product[]>(
            `products?supplier=${purchase.supplier.id}`
          );
          setProducts(supplierProducts);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load initial data");
        router.back();
      } finally {
        setIsProductsLoading(false);
      }
    };

    fetchSuppliers();
  }, [router, purchase]);

  const handleSupplierChange = async (supplierId: number) => {
    try {
      setIsProductsLoading(true);
      const products = await fetchProtectedData<Product[]>(
        `products?supplier=${supplierId}`
      );
      setProducts(products);
      setSelectedSupplierId(supplierId);
      form.resetField("items");
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setIsProductsLoading(false);
    }
  };

  const handleSubmit = async (data: PurchaseFormValues) => {
    setIsSubmitting(true);

    try {
      const purchaseData = {
        supplierId: data.supplierId,
        items: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        purchaseDate: data.purchaseDate.toISOString(),
        status: data.status,
        notes: data.notes,
      };

      const endpoint = "purchases";
      const method = mode === "create" ? postData : patchData;
      const url = mode === "create" ? endpoint : `${endpoint}/${purchase?.id}`;

      const response = await method(url, purchaseData);

      if (response.statusCode === 201 || response.statusCode === 200) {
        toast.success(
          mode === "create"
            ? "Purchase created successfully"
            : "Purchase updated successfully"
        );
        router.back();
      } else {
        toast.error(response?.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-6">
          <SectionCard
            title="Supplier Information"
            icon={Users}
          >
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Supplier <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const supplierId = Number(value);
                      field.onChange(supplierId);
                      handleSupplierChange(supplierId);
                    }}
                    value={field.value?.toString()}
                  >
                    <SelectTrigger className="w-full">
                      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <SelectValue placeholder="Select a supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem
                          key={supplier.id}
                          value={supplier.id.toString()}
                        >
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SectionCard>

          <SectionCard
            title="Purchase Items"
            icon={ShoppingCart}
            action={
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  append({ productId: 1, quantity: 1, unitPrice: 0 })
                }
                disabled={!selectedSupplierId || isProductsLoading}
              >
                {isProductsLoading ? (
                  <LoadingIndicator message="Loading Purchase..." />
                ) : (
                  <Plus className="mr-1 h-4 w-4" />
                )}
                Add Product
              </Button>
            }
          >
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
                >
                  <FormField
                    control={form.control}
                    name={`items.${index}.productId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Product <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={(value) => {
                            const productId = Number(value);
                            field.onChange(productId);
                            const selectedProduct = products.find(
                              (p) => p.id === productId
                            );
                            if (selectedProduct) {
                              form.setValue(
                                `items.${index}.unitPrice`,
                                selectedProduct.purchasePrice
                              );
                            }
                          }}
                          value={field.value?.toString()}
                          disabled={!selectedSupplierId || isProductsLoading}
                        >
                          <SelectTrigger className="w-full">
                            <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <SelectValue
                              placeholder={
                                isProductsLoading
                                  ? "Loading products..."
                                  : "Select product"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {isProductsLoading ? (
                              <LoadingIndicator message="Loading products..." />
                            ) : (
                              products.map((product) => (
                                <SelectItem
                                  key={product.id}
                                  value={product.id.toString()}
                                >
                                  {product.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Quantity <span className="text-destructive">*</span>
                        </FormLabel>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="number"
                            min="1"
                            className="w-full pl-9"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormItem>
                    <FormLabel>
                      Unit Price <span className="text-destructive">*</span>
                    </FormLabel>
                    <div className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm">
                      <Banknote className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {form.watch(`items.${index}.unitPrice`).toFixed(2)}
                    </div>
                  </FormItem>

                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-9 w-9 sm:mb-0.5"
                    title="Remove item"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Purchase Details"
            icon={FileText}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Purchase Date <span className="text-destructive">*</span>
                    </FormLabel>

                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select Purchase Date"
                      className="w-full"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Status <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full">
                        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <div className="relative">
                      <StickyNote className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        {...field}
                        placeholder="Add any notes (optional)..."
                        className="w-full pl-9"
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </SectionCard>

          <SectionCard title="Order Summary" icon={ClipboardList}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center gap-4 rounded-lg bg-blue-50/80 px-5 py-4 dark:bg-blue-950/30">
                <Package className="h-6 w-6 shrink-0 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Quantity</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {form
                      .watch("items")
                      .reduce((acc, item) => acc + item.quantity, 0)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-lg bg-emerald-50/80 px-5 py-4 dark:bg-emerald-950/30">
                <Banknote className="h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Price</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {form
                      .watch("items")
                      .reduce(
                        (acc, item) => acc + item.quantity * item.unitPrice,
                        0
                      )
                      .toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="sticky bottom-0 z-10 mt-6 border-t bg-background/95 px-2 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isProductsLoading}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "create" ? "Creating..." : "Updating..."}
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  {mode === "create" ? "Create Purchase" : "Update Purchase"}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
