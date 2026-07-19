"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Category {
  id: number;
  name: string;
}

interface Brand {
  id: number;
  name: string;
}

interface PriceRange {
  min: number;
  max: number;
  label: string;
}

interface ProductFiltersProps {
  categories: Category[];
  brands: Brand[];
  priceRanges: PriceRange[];
  currentCategory?: string;
  currentBrand?: string;
  currentFeatured?: boolean;
  currentPriceRange?: {
    min?: string;
    max?: string;
  };
}

// Define the specific price ranges as requested
const PRICE_RANGES: PriceRange[] = [
  { min: 0, max: 5000, label: "Under BDT 5,000" },
  { min: 5000, max: 10000, label: "BDT 5,000 - 10,000" },
  { min: 10000, max: 50000, label: "BDT 10,000 - 50,000" },
  { min: 50000, max: 100000, label: "BDT 50,000 - 100,000" },
  { min: 100000, max: Number.POSITIVE_INFINITY, label: "Above BDT 100,000" },
];

export function BrandFilters({
  categories,
  brands,
  currentCategory,
  currentBrand,
  currentFeatured,
  currentPriceRange,
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [priceFilterType, setPriceFilterType] = useState<"range" | "slider">(
    "range"
  );

  // Count active filters
  const activeFiltersCount = [
    currentCategory ? 1 : 0,
    currentBrand ? 1 : 0,
    currentFeatured ? 1 : 0,
    currentPriceRange?.min || currentPriceRange?.max ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const hasActiveFilters = activeFiltersCount > 0;

  const MAX_PRICE = 100000;

  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(currentPriceRange?.min || 0),
    Number(currentPriceRange?.max || MAX_PRICE),
  ]);

  useEffect(() => {
    setPriceRange([
      Number(currentPriceRange?.min || 0),
      currentPriceRange?.max === "Infinity" || !currentPriceRange?.max
        ? MAX_PRICE
        : Number(currentPriceRange.max),
    ]);
  }, [currentPriceRange]);

  const createQueryString = (params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams.toString());

    Object.entries(params).forEach(([name, value]) => {
      if (value === null) {
        newParams.delete(name);
      } else {
        newParams.set(name, value);
      }
    });

    return newParams.toString();
  };

  const handleCategoryChange = (categoryId: number) => {
    const params = {
      category:
        categoryId.toString() === currentCategory
          ? null
          : categoryId.toString(),
    };
    router.push(`${pathname}?${createQueryString(params)}`);
  };

  const handleBrandChange = (brandId: number) => {
    const params = {
      brand: brandId.toString() === currentBrand ? null : brandId.toString(),
    };
    router.push(`${pathname}?${createQueryString(params)}`);
  };

  const handleFeaturedChange = (checked: boolean) => {
    const params = {
      featured: checked ? "true" : null,
    };
    router.push(`${pathname}?${createQueryString(params)}`);
  };

  const handlePriceRangeChange = (value: string) => {
    if (!value) {
      router.push(
        `${pathname}?${createQueryString({ minPrice: null, maxPrice: null })}`
      );
      return;
    }

    const [min, max] = value.split("-");
    router.push(
      `${pathname}?${createQueryString({
        minPrice: min,
        maxPrice: max === "Infinity" ? max : max,
      })}`
    );
  };

  const handleSliderPriceChange = (values: number[]) => {
    setPriceRange([values[0], values[1]]);
  };

  const handleSliderPriceChangeCommitted = () => {
    const min = priceRange[0];
    const max = priceRange[1];

    if (min === 0 && max === MAX_PRICE) {
      router.push(
        `${pathname}?${createQueryString({ minPrice: null, maxPrice: null })}`
      );
      return;
    }

    const maxValue = max === MAX_PRICE ? "Infinity" : max.toString();

    router.push(
      `${pathname}?${createQueryString({
        minPrice: min.toString(),
        maxPrice: maxValue,
      })}`
    );
  };

  const handleResetFilters = () => {
    router.push(pathname);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "BDT",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const currentPriceValue =
    currentPriceRange?.min && currentPriceRange?.max
      ? `${currentPriceRange.min}-${currentPriceRange.max}`
      : undefined;

  const currentCategoryName = currentCategory
    ? categories.find((c) => c.id.toString() === currentCategory)?.name
    : null;
  const currentBrandName = currentBrand
    ? brands.find((b) => b.id.toString() === currentBrand)?.name
    : null;

  return (
    <Card className="border-none shadow-none">
      <CardContent className="p-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Filters</h3>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Clear All
            </Button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {currentCategoryName && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 pl-2 pr-1 py-1 bg-background hover:bg-muted transition-colors"
                >
                  <span className="text-xs">
                    Category: {currentCategoryName}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 rounded-full"
                    onClick={() =>
                      handleCategoryChange(Number.parseInt(currentCategory!))
                    }
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove category filter</span>
                  </Button>
                </Badge>
              )}
              {currentBrandName && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 pl-2 pr-1 py-1 bg-background hover:bg-muted transition-colors"
                >
                  <span className="text-xs">Brand: {currentBrandName}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 rounded-full"
                    onClick={() =>
                      handleBrandChange(Number.parseInt(currentBrand!))
                    }
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove brand filter</span>
                  </Button>
                </Badge>
              )}
              {currentFeatured && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 pl-2 pr-1 py-1 bg-background hover:bg-muted transition-colors"
                >
                  <span className="text-xs">Featured Only</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 rounded-full"
                    onClick={() => handleFeaturedChange(false)}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove featured filter</span>
                  </Button>
                </Badge>
              )}
              {(currentPriceRange?.min || currentPriceRange?.max) && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 pl-2 pr-1 py-1 bg-background hover:bg-muted transition-colors"
                >
                  <span className="text-xs">
                    Price:{" "}
                    {currentPriceRange.min && currentPriceRange.max
                      ? `${formatPrice(Number(currentPriceRange.min))} - ${
                          currentPriceRange.max === "Infinity"
                            ? `${formatPrice(MAX_PRICE)}+`
                            : formatPrice(Number(currentPriceRange.max))
                        }`
                      : currentPriceRange.min
                      ? `Min ${formatPrice(Number(currentPriceRange.min))}`
                      : `Max ${formatPrice(Number(currentPriceRange.max))}`}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 rounded-full"
                    onClick={() =>
                      router.push(
                        `${pathname}?${createQueryString({
                          minPrice: null,
                          maxPrice: null,
                        })}`
                      )
                    }
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove price filter</span>
                  </Button>
                </Badge>
              )}
            </div>
          </div>
        )}

        <Separator className="mb-6" />

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Featured Products</h4>
              <Switch
                id="featured"
                checked={currentFeatured || false}
                onCheckedChange={handleFeaturedChange}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Show only featured products
            </p>
          </div>

          <Accordion
            type="multiple"
            defaultValue={["categories", "brands", "price"]}
            className="space-y-4"
          >
            <AccordionItem
              value="categories"
              className="border rounded-md px-4 py-2"
            >
              <AccordionTrigger className="text-sm font-medium py-2 hover:no-underline">
                Categories
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={category.id.toString() === currentCategory}
                        onCheckedChange={() =>
                          handleCategoryChange(category.id)
                        }
                      />
                      <Label
                        htmlFor={`category-${category.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="brands"
              className="border rounded-md px-4 py-2"
            >
              <AccordionTrigger className="text-sm font-medium py-2 hover:no-underline">
                Brands
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {brands.map((brand) => (
                    <div key={brand.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`brand-${brand.id}`}
                        checked={brand.id.toString() === currentBrand}
                        onCheckedChange={() => handleBrandChange(brand.id)}
                      />
                      <Label
                        htmlFor={`brand-${brand.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {brand.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="price"
              className="border rounded-md px-4 py-2"
            >
              <AccordionTrigger className="text-sm font-medium py-2 hover:no-underline">
                Price Range
              </AccordionTrigger>
              <AccordionContent>
                <Tabs
                  defaultValue={priceFilterType}
                  onValueChange={(value) =>
                    setPriceFilterType(value as "range" | "slider")
                  }
                  className="mt-2"
                >
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="range">Preset Ranges</TabsTrigger>
                    <TabsTrigger value="slider">Custom Range</TabsTrigger>
                  </TabsList>
                  <TabsContent value="range">
                    <RadioGroup
                      value={currentPriceValue}
                      onValueChange={handlePriceRangeChange}
                      className="space-y-2"
                    >
                      {PRICE_RANGES.map((range) => (
                        <div
                          key={range.label}
                          className="flex items-center space-x-2"
                        >
                          <RadioGroupItem
                            value={`${range.min}-${
                              range.max === Number.POSITIVE_INFINITY
                                ? "Infinity"
                                : range.max
                            }`}
                            id={`price-${range.min}-${range.max}`}
                          />
                          <Label
                            htmlFor={`price-${range.min}-${range.max}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {range.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </TabsContent>
                  <TabsContent value="slider">
                    <div className="space-y-6 pt-2 px-1">
                      <Slider
                        defaultValue={[0, MAX_PRICE]}
                        value={priceRange}
                        min={0}
                        max={MAX_PRICE}
                        step={1000}
                        onValueChange={handleSliderPriceChange}
                        onValueCommit={handleSliderPriceChangeCommitted}
                        className="mb-6"
                      />

                      <div className="flex items-center justify-between">
                        <div className="border rounded-md px-3 py-1.5">
                          <span className="text-sm">
                            {formatPrice(priceRange[0])}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">to</div>
                        <div className="border rounded-md px-3 py-1.5">
                          <span className="text-sm">
                            {priceRange[1] === MAX_PRICE
                              ? `${formatPrice(MAX_PRICE)}+`
                              : formatPrice(priceRange[1])}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {hasActiveFilters && (
            <div className="pt-4 md:hidden">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResetFilters}
              >
                Reset All Filters
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
