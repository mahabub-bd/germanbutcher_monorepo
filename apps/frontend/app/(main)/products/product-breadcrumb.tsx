'use client';
import {
  BreadcrumbBar,
} from "@/components/common/breadcrumb-bar";
import { fetchData } from "@/utils/api-utils";
import { useEffect, useState } from "react";

interface ProductsBreadcrumbProps {
  categoryId?: string;
  categoryName?: string;
  categorySlug?: string;
  brandId?: string;
  brandName?: string;
  brandSlug?: string;
}

interface CategoryResponse {
  message: string;
  statusCode: number;
  data: {
    id: number;
    name: string;
    slug: string;
  };
}

interface BrandResponse {
  message: string;
  statusCode: number;
  data: {
    id: number;
    name: string;
    slug: string;
  };
}

export function ProductsBreadcrumb({
  categoryId,
  categoryName: initialCategoryName,
  categorySlug: initialCategorySlug,
  brandId,
  brandName: initialBrandName,
  brandSlug: initialBrandSlug,
}: ProductsBreadcrumbProps) {
  const [categoryData, setCategoryData] = useState<{
    name: string;
    slug: string;
  } | null>(
    initialCategoryName && initialCategorySlug
      ? { name: initialCategoryName, slug: initialCategorySlug }
      : null
  );

  const [brandData, setBrandData] = useState<{
    name: string;
    slug: string;
  } | null>(
    initialBrandName && initialBrandSlug
      ? { name: initialBrandName, slug: initialBrandSlug }
      : null
  );

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCategoryData = async () => {
      if (categoryId && !initialCategoryName) {
        setIsLoading(true);
        try {
          const response = await fetchData<CategoryResponse>(
            `categories/${categoryId}`
          );
          setCategoryData({
            name: response.data.name,
            slug: response.data.slug,
          });
        } catch (error) {
          console.error("Error fetching category:", error);
          setCategoryData(null);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchCategoryData();
  }, [categoryId, initialCategoryName]);

  useEffect(() => {
    const fetchBrandData = async () => {
      if (brandId && !initialBrandName) {
        setIsLoading(true);
        try {
          const response = await fetchData<BrandResponse>(`brands/${brandId}`);
          setBrandData({
            name: response.data.name,
            slug: response.data.slug,
          });
        } catch (error) {
          console.error("Error fetching brand:", error);
          setBrandData(null);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchBrandData();
  }, [brandId, initialBrandName]);

  const hasFilters = Boolean(categoryId || categoryData || brandId || brandData);

  const items: { label: string; href?: string }[] = [];

  if (hasFilters) {
    items.push({ label: "Products", href: "/products" });
  }

  if (categoryData) {
    // Only the last crumb is the current page — when a brand follows, the
    // category renders as a link instead.
    items.push({
      label: categoryData.name,
      href: brandData ? `/categories/${categoryData.slug}` : undefined,
    });
  } else if (isLoading && categoryId && !initialCategoryName) {
    items.push({ label: "Loading..." });
  }

  if (brandData) {
    items.push({ label: brandData.name });
  } else if (isLoading && brandId && !initialBrandName) {
    items.push({ label: "Loading..." });
  }

  if (!hasFilters) {
    items.push({ label: "Products" });
  }

  return <BreadcrumbBar items={items} />;
}
