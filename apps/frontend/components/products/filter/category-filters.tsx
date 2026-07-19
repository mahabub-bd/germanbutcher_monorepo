"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronRight,
  DollarSign,
  Filter,
  Grid3X3,
  Tag,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface Category {
  id: number;
  name: string;
  parentId?: number | null;
  isMainCategory: boolean;
  children?: Category[];
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
  tags: string[];
  currentCategory?: string;
  currentBrand?: string;
  currentFeatured?: boolean;
  currentPriceRange?: {
    min?: string;
    max?: string;
  };
  currentTags?: string;
}

export function CategoryFilters({
  categories,
  brands,
  priceRanges,
  tags,
  currentCategory,
  currentBrand,
  currentFeatured,
  currentPriceRange,
  currentTags,
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [priceFilterType, setPriceFilterType] = useState<"range" | "slider">(
    "range"
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [openCategories, setOpenCategories] = useState<Set<number>>(new Set());

  const organizedCategories = useMemo(() => {
    return categories.filter((cat) => cat.isMainCategory);
  }, [categories]);

  const activeFiltersCount = [
    currentCategory ? 1 : 0,
    currentBrand ? 1 : 0,
    currentFeatured ? 1 : 0,
    currentPriceRange?.min || currentPriceRange?.max ? 1 : 0,
    currentTags ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const hasActiveFilters = activeFiltersCount > 0;

  const MAX_PRICE = 4000;

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
  }, [currentPriceRange, MAX_PRICE]);

  useEffect(() => {
    if (currentCategory) {
      const selectedCat = categories.find(
        (cat) => cat.id.toString() === currentCategory
      );
      if (
        selectedCat &&
        selectedCat.parentId !== null &&
        selectedCat.parentId !== undefined
      ) {
        setOpenCategories(
          (prev) => new Set([...prev, selectedCat.parentId as number])
        );
      }
    }
  }, [currentCategory, categories]);

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
      page: "1",
    };
    router.push(`${pathname}?${createQueryString(params)}`);
    setIsSheetOpen(false);
  };

  const handleBrandChange = (brandId: number) => {
    const params = {
      brand: brandId.toString() === currentBrand ? null : brandId.toString(),
      page: "1",
    };
    router.push(`${pathname}?${createQueryString(params)}`);
    setIsSheetOpen(false);
  };


  const handlePriceRangeChange = (value: string) => {
    if (!value) {
      router.push(
        `${pathname}?${createQueryString({
          minPrice: null,
          maxPrice: null,
          page: "1",
        })}`
      );
      setIsSheetOpen(false);
      return;
    }

    const [min, max] = value.split("-");
    router.push(
      `${pathname}?${createQueryString({
        minPrice: min,
        maxPrice: max,
        page: "1",
      })}`
    );
    setIsSheetOpen(false);
  };

  const handleTagsClear = () => {
    router.push(
      `${pathname}?${createQueryString({
        tags: null,
        page: "1",
      })}`
    );
    setIsSheetOpen(false);
  };

  const handleSliderPriceChangeCommitted = (values: number[]) => {
    const min = values[0];
    const max = values[1];

    if (min === 0 && max === MAX_PRICE) {
      router.push(
        `${pathname}?${createQueryString({
          minPrice: null,
          maxPrice: null,
          page: "1",
        })}`
      );
      return;
    }

    const maxValue = max === MAX_PRICE ? "Infinity" : max.toString();

    router.push(
      `${pathname}?${createQueryString({
        minPrice: min.toString(),
        maxPrice: maxValue,
        page: "1",
      })}`
    );
  };

  const handleResetFilters = () => {
    router.push(pathname);
    setIsSheetOpen(false);
  };

  const formatCurrencyEnglish = (price: number) => {
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


  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  const handleSliderPriceChangeWithDebounce = (values: number[]) => {
    setPriceRange([values[0], values[1]]);

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      handleSliderPriceChangeCommitted(values);
    }, 500);

    setDebounceTimer(timer);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const toggleCategoryOpen = (categoryId: number) => {
    setOpenCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const FilterContent = () => (
    <>


      <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-lg border border-red-100 dark:border-red-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-800/50 rounded-full">
            <Filter className="h-5 w-5 text-red-700 dark:text-red-300" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Filters</h3>
          </div>
          {hasActiveFilters && (
            <Badge
              variant="secondary"
              className="ml-2 bg-red-100 text-red-800 border-red-200 dark:bg-red-800/50 dark:text-red-200 dark:border-red-600"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-8 text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground hover:bg-destructive/10"
          >
            <X className="h-3.5 w-3.5" />
            Clear All
          </Button>
        )}
      </div>

      <div className="space-y-6">
        <Accordion
          type="multiple"
          defaultValue={["categories", "brands", "price", "tags"]}
          className="space-y-4"
        >
          <AccordionItem
            value="categories"
            className="border border-red-100 dark:border-red-700 rounded-lg px-4 py-2 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20"
          >
            <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline text-red-800 dark:text-red-200">
              <div className="flex items-center gap-2">
                <Grid3X3 className="h-4 w-4" />
                Categories
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {organizedCategories.map((category) => (
                  <div key={category.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={category.id.toString() === currentCategory}
                          onCheckedChange={() =>
                            handleCategoryChange(category.id)
                          }
                        />
                        <Label
                          htmlFor={`category-${category.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {category.name}
                        </Label>
                      </div>
                      {category.children && category.children.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCategoryOpen(category.id)}
                          className="h-6 w-6 p-0"
                        >
                          <ChevronRight
                            className={`h-4 w-4 transition-transform ${openCategories.has(category.id) ? "rotate-90" : ""
                              }`}
                          />
                        </Button>
                      )}
                    </div>

                    {category.children &&
                      category.children.length > 0 &&
                      openCategories.has(category.id) && (
                        <div className="ml-6 space-y-2 border-l-2 border-red-100 dark:border-red-800 pl-4">
                          {category.children.map((subCategory) => (
                            <div
                              key={subCategory.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`category-${subCategory.id}`}
                                checked={
                                  subCategory.id.toString() === currentCategory
                                }
                                onCheckedChange={() =>
                                  handleCategoryChange(subCategory.id)
                                }
                              />
                              <Label
                                htmlFor={`category-${subCategory.id}`}
                                className="text-sm font-normal cursor-pointer text-muted-foreground hover:text-foreground"
                              >
                                {subCategory.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="price"
            className="border border-red-100 dark:border-red-700 rounded-lg px-4 py-2 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30"
          >
            <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline text-red-800 dark:text-red-200">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Price Range
              </div>
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
                    {priceRanges.map((range) => (
                      <div
                        key={range.label}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={`${range.min}-${range.max === Number.POSITIVE_INFINITY
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
                    <div className="space-y-4 p-4 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 rounded-lg border border-red-100 dark:border-red-700">
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground mb-2">
                          Custom Price Range
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Drag to set your budget
                        </p>
                      </div>

                      <Slider
                        defaultValue={[0, MAX_PRICE]}
                        value={priceRange}
                        min={0}
                        max={MAX_PRICE}
                        step={100}
                        onValueChange={handleSliderPriceChangeWithDebounce}
                        className="mb-6 cursor-pointer"
                      />

                      <div className="flex items-center justify-between mb-4">
                        <div className="border border-red-100 bg-red-50 dark:border-red-600 dark:bg-red-950/50 rounded-lg px-3 py-2 shadow-sm">
                          <span className="text-sm font-medium text-red-800 dark:text-red-200">
                            {formatCurrencyEnglish(priceRange[0])}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">
                          to
                        </div>
                        <div className="border border-red-200 bg-red-50 dark:border-red-600 dark:bg-red-950/50 rounded-lg px-3 py-2 shadow-sm">
                          <span className="text-sm font-medium text-red-800 dark:text-red-200">
                            {priceRange[1] === MAX_PRICE
                              ? `${formatCurrencyEnglish(MAX_PRICE)}+`
                              : formatCurrencyEnglish(priceRange[1])}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() =>
                            handleSliderPriceChangeCommitted(priceRange)
                          }
                          className="flex-1 bg-red-800 hover:bg-red-900 text-white"
                          size="sm"
                        >
                          Apply Filter
                        </Button>
                        <Button
                          onClick={() => {
                            setPriceRange([0, MAX_PRICE]);
                            router.push(
                              `${pathname}?${createQueryString({
                                minPrice: null,
                                maxPrice: null,
                              })}`
                            );
                          }}
                          variant="outline"
                          size="sm"
                          className="px-3"
                        >
                          Reset
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="tags"
            className="border border-red-100 dark:border-red-700 rounded-lg px-4 py-2 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20"
          >
            <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline text-red-800 dark:text-red-200">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Popular Tags
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const isActive = currentTags?.split(",").includes(tag) || false;
                    return (
                      <Badge
                        key={tag}
                        variant={isActive ? "default" : "outline"}
                        className={`cursor-pointer capitalize transition-all px-3 py-0.5 text-sm font-medium rounded-full ${isActive
                          ? "bg-primaryColor text-white border-primaryColor hover:bg-primaryColor shadow-md"
                          : "bg-white text-primaryColor border-2 border-red-200 hover:border-primaryColor hover:bg-red-50 hover:shadow-sm"
                          }`}
                        onClick={() => {
                          const currentTagsArray = currentTags?.split(",").filter(Boolean) || [];
                          const isTagActive = currentTagsArray.includes(tag);
                          const newTags = isTagActive
                            ? currentTagsArray
                              .filter((t) => t !== tag)
                              .join(",")
                            : [...currentTagsArray, tag].join(",");
                          router.push(
                            `${pathname}?${createQueryString({
                              tags: newTags || null,
                              page: "1",
                            })}`
                          );
                          setIsSheetOpen(false);
                        }}
                      >
                        {tag}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="brands"
            className="border border-red-100 dark:border-red-700 rounded-lg px-4 py-2 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20"
          >
            <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline text-red-800 dark:text-red-200">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Brands
              </div>
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
        </Accordion>
      </div>
    </>
  );

  return (
    <>
      <ScrollArea className="w-80 shadow-none p-2 md:flex hidden absolute top-2">
        <div className="p-2">
          <FilterContent />
        </div>
      </ScrollArea>

      <div className="md:hidden z-50">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button
              className="relative group shadow-xl border-0 bg-gradient-to-r from-red-800 to-red-700 hover:from-red-900 hover:to-red-800 text-white font-medium px-4 rounded-full"
              size="lg"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="text-xs font-semibold">Filters</span>
              </div>
              {hasActiveFilters && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 rounded-full text-xs font-bold"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="sm:max-w-md overflow-y-auto p-6"
          >
            <SheetTitle className="sr-only">Filter Menu</SheetTitle>
            <div className="py-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
