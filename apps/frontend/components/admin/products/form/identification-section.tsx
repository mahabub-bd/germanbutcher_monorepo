"use client";

import { WandSparkles, Box } from "lucide-react";
import { useFormContext } from "react-hook-form";
import type { Control } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
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

import { SectionCard } from "@/components/admin/products/form/section-card";
import type { ProductFormValues } from "@/components/admin/products/form/types";
import type { Brand, Category, Supplier, Unit } from "@/utils/types";

interface IdentificationSectionProps {
  control: Control<ProductFormValues>;
  units: Unit[];
  suppliers: Supplier[];
  brands: Brand[];
  categories: Category[];
  selectedMainCategory: number | null;
  subCategories: Category[];
  isLoadingSubCategories: boolean;
  onMainCategoryChange: (value: string) => void;
}

export function IdentificationSection({
  control,
  units,
  suppliers,
  brands,
  categories,
  selectedMainCategory,
  subCategories,
  isLoadingSubCategories,
  onMainCategoryChange,
}: IdentificationSectionProps) {
  const form = useFormContext<ProductFormValues>();

  const generateSku = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";

    const randomFrom = (source: string, length: number) =>
      Array(length)
        .fill(0)
        .map(() => source.charAt(Math.floor(Math.random() * source.length)))
        .join("");

    const sku = `${randomFrom(chars, 2)}-${randomFrom(numbers, 4)}-${randomFrom(chars, 2)}`;
    form.setValue("productSku", sku, { shouldDirty: true });
  };

  return (
    <SectionCard icon={Box} title="Product Identification">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <FormField
          control={control}
          name="productSku"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>
                SKU <span className="text-destructive">*</span>
              </FormLabel>
              <div className="grid grid-cols-2 gap-2">
                <FormControl>
                  <Input placeholder="Enter product SKU" {...field} />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateSku}
                  className="whitespace-nowrap border-green-300 bg-green-100 text-green-800 hover:bg-green-200"
                >
                  <WandSparkles className="mr-1 h-4 w-4" />
                  Generate SKU
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="unitId"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>
                Unit <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  value={field.value > 0 ? field.value.toString() : undefined}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units?.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="supplierId"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Supplier</FormLabel>
              <FormControl>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  value={field.value > 0 ? field.value.toString() : undefined}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="brandId"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Brand</FormLabel>
              <FormControl>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  value={field.value > 0 ? field.value.toString() : undefined}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id.toString()}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem className="w-full">
          <FormLabel>Main Category</FormLabel>
          <Select
            onValueChange={onMainCategoryChange}
            value={selectedMainCategory?.toString() || undefined}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select main category" />
            </SelectTrigger>
            <SelectContent>
              {categories
                .filter((c) => c.isMainCategory || !c.parentId)
                .map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </FormItem>

        <FormItem className="w-full">
          <FormLabel>Sub Category</FormLabel>
          <FormField
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                value={field.value > 0 ? field.value.toString() : undefined}
                disabled={!selectedMainCategory || isLoadingSubCategories}
              >
                <SelectTrigger className="w-full">
                  {isLoadingSubCategories ? (
                    <span className="text-muted-foreground">
                      Loading subcategories...
                    </span>
                  ) : (
                    <SelectValue placeholder="Select sub category" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {subCategories.length > 0 ? (
                    subCategories.map((subCategory) => (
                      <SelectItem
                        key={subCategory.id}
                        value={subCategory.id.toString()}
                      >
                        {subCategory.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      No subcategories available
                    </div>
                  )}
                </SelectContent>
              </Select>
            )}
          />
        </FormItem>
      </div>
    </SectionCard>
  );
}
