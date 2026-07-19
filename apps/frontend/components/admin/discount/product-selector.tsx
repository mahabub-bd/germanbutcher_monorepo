"use client";

import type React from "react";

import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Product } from "@/utils/types";

interface ProductSelectorProps {
  products: Product[];
  selectedProductIds: number[];
  onChange: (value: number[]) => void;
  isLoading?: boolean;
  showOnlyNonDiscounted?: boolean;
}

export function ProductSelector({
  products,
  selectedProductIds,
  onChange,
  isLoading = false,
  showOnlyNonDiscounted = true,
}: ProductSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const availableProducts = showOnlyNonDiscounted
    ? products.filter((product) => !product.discountType)
    : products;

  const filteredProducts = availableProducts.filter((product) => {
    return product.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggleProduct = (productId: number) => {
    if (selectedProductIds.includes(productId)) {
      onChange(selectedProductIds.filter((id) => id !== productId));
    } else {
      onChange([...selectedProductIds, productId]);
    }
  };

  const removeProduct = (productId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedProductIds.filter((id) => id !== productId));
  };

  const selectedProducts = products.filter((product) =>
    selectedProductIds.includes(product.id)
  );

  return (
    <div className="space-y-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={isLoading}
          >
            <span className="truncate">
              {isLoading
                ? "Loading products..."
                : selectedProductIds.length > 0
                ? `${selectedProductIds.length} product${
                    selectedProductIds.length > 1 ? "s" : ""
                  } selected`
                : "Select products..."}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder="Search products..."
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
            </div>
            <CommandList>
              <CommandEmpty>
                {showOnlyNonDiscounted
                  ? "No products without discounts found."
                  : "No products found."}
              </CommandEmpty>
              <CommandGroup>
                <ScrollArea className="h-[300px]">
                  {filteredProducts.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={product.id.toString()}
                      onSelect={() => toggleProduct(product.id)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <span
                          className={cn(
                            "mr-2",
                            selectedProductIds.includes(product.id)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        >
                          <Check className="h-4 w-4" />
                        </span>
                        <span>{product.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {product.sellingPrice.toFixed(2)}
                      </span>
                    </CommandItem>
                  ))}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-2 border rounded-md p-2">
          {selectedProducts.map((product) => (
            <Badge
              key={product.id}
              variant="secondary"
              className="flex items-center gap-1 pl-2"
            >
              {product.name}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 rounded-full"
                onClick={(e) => removeProduct(product.id, e)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {product.name}</span>
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
