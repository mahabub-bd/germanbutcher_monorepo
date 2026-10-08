"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Category } from "@/utils/types";
import { Check, ImageOff, Layers, Search } from "lucide-react";

interface CategorySelectorProps {
  categories: Category[];
  selectedCategoryId: number | null;
  onSelect: (category: Category | null) => void;
  searchQuery: string;
  isLoading?: boolean;
  disabled?: boolean;
  /** Grid classes for the card layout. */
  gridClassName?: string;
}

/** Category picker cards — same look as ProductSelector (image + checkbox),
 * but single-select and without price/weight. */
export function CategorySelector({
  categories,
  selectedCategoryId,
  onSelect,
  searchQuery,
  isLoading = false,
  disabled = false,
  gridClassName = "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4",
}: CategorySelectorProps) {
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {disabled ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
          <Layers className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No categories available
          </p>
        </div>
      ) : isLoading ? (
        <div className={gridClassName}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
          <Search className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? "No categories match your search"
              : "No categories found"}
          </p>
        </div>
      ) : (
        <div className={gridClassName}>
          {filteredCategories.map((category) => {
            const isSelected = selectedCategoryId === category.id;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onSelect(isSelected ? null : category)}
                aria-pressed={isSelected}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                  isSelected
                    ? "border-red-500 bg-red-50/60"
                    : "border-border bg-card hover:border-red-300"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                    isSelected
                      ? "border-red-600 bg-red-600 text-white"
                      : "border-muted-foreground/40 bg-background"
                  )}
                >
                  {isSelected && <Check className="h-3.5 w-3.5" />}
                </span>

                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                  {category.attachment?.url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={category.attachment.url}
                      alt={category.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <ImageOff className="h-5 w-5 text-muted-foreground/50" />
                    </span>
                  )}
                </span>

                <span className="min-w-0 flex flex-col gap-0.5">
                  <span className="text-sm font-medium leading-tight line-clamp-2">
                    {category.name}
                  </span>
                  {category.productCount !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      {category.productCount} product
                      {category.productCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
