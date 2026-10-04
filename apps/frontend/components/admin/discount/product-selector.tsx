"use client";

import { formatCurrencyEnglish } from "@/lib/utils";
import {
  DiscountType,
  type DiscountType as DiscountTypeValue,
  type MinimalProduct,
} from "@/utils/types";
import { Check, ImageOff, Package, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ProductSelectorProps {
  products: MinimalProduct[];
  selectedProductIds: number[];
  onChange: (value: number[]) => void;
  searchQuery: string;
  isLoading?: boolean;
  disabled?: boolean;
  /** Discount applied to the currently selected products (live preview) */
  discountType?: DiscountTypeValue;
  discountValue?: number;
}

/** Price pair shown on a card: the effective price after the discount that
 * applies to it (new discount for selected products, existing one otherwise)
 * plus the struck-through original when a discount is in effect. */
function getPrice(
  product: MinimalProduct,
  isSelected: boolean,
  formType?: DiscountTypeValue,
  formValue?: number
): { price: number; original: number | null } {
  const type = isSelected ? formType : product.discountType;
  const value = isSelected ? formValue ?? 0 : product.discountValue ?? 0;

  if (!type || !value) return { price: product.sellingPrice, original: null };

  const price =
    type === DiscountType.PERCENTAGE
      ? product.sellingPrice * (1 - value / 100)
      : Math.max(0, product.sellingPrice - value);
  return { price, original: product.sellingPrice };
}

export function ProductSelector({
  products,
  selectedProductIds,
  onChange,
  searchQuery,
  isLoading = false,
  disabled = false,
  discountType,
  discountValue,
}: ProductSelectorProps) {

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleProduct = (productId: number) => {
    if (selectedProductIds.includes(productId)) {
      onChange(selectedProductIds.filter((id) => id !== productId));
    } else {
      onChange([...selectedProductIds, productId]);
    }
  };

  return (
    <div className="space-y-4">
      {disabled ? (
        <div className="flex flex-col items-center justify-center gap-2 border border-dashed rounded-lg p-10 text-center">
          <Package className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Select a category to load its products
          </p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 border border-dashed rounded-lg p-10 text-center">
          <Search className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {searchQuery ? "No products match your search" : "No products in this category"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const isSelected = selectedProductIds.includes(product.id);
            const { price, original } = getPrice(
              product,
              isSelected,
              discountType,
              discountValue
            );
            const weightLabel =
              product.weight != null
                ? `${parseFloat(String(product.weight))} ${product.unitName ?? ""} (Approx.)`
                : null;

            return (
              <button
                key={product.id}
                type="button"
                onClick={() => toggleProduct(product.id)}
                aria-pressed={isSelected}
                className={cn(
                  "relative flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                  isSelected
                    ? "border-red-500 bg-red-50/60"
                    : "border-border bg-card hover:border-red-300"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                    isSelected
                      ? "border-red-600 bg-red-600 text-white"
                      : "border-muted-foreground/40 bg-background"
                  )}
                >
                  {isSelected && <Check className="h-3.5 w-3.5" />}
                </span>

                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                  {product.attachmentUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={product.attachmentUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <ImageOff className="h-5 w-5 text-muted-foreground/50" />
                    </span>
                  )}
                </span>

                <span className="min-w-0 flex flex-col gap-0.5">
                  <span className="font-medium text-sm leading-tight line-clamp-2">
                    {product.name}
                  </span>
                  {weightLabel && (
                    <span className="text-xs text-muted-foreground">
                      {weightLabel}
                    </span>
                  )}
                  <span className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-red-600 font-bold text-sm">
                      {formatCurrencyEnglish(price)}
                    </span>
                    {original !== null && (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatCurrencyEnglish(original)}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
