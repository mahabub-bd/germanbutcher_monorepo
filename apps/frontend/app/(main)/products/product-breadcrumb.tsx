'use client';
import {
  PageBreadcrumb,
  type BreadcrumbItem,
} from "@/components/ui/page-breadcrumb";
import { fetchData } from "@/utils/api-utils";
import { Package2 } from "lucide-react";
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

  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: "Products",
      icon: (
        <Package2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primaryColor" />
      ),
      isActive: !categoryData && !brandData && !categoryId && !brandId,
    },
  ];

  // Only add category breadcrumb if we have the data or it's loading
  if (categoryId) {
    if (categoryData) {
      breadcrumbItems.push({
        label: categoryData.name,
        href: `/categories/${categoryData.slug}`,
        icon: <Package2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />,
        isActive: true,
      });
    } else if (isLoading) {
      breadcrumbItems.push({
        label: "Loading...",
        icon: <Package2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />,
        isActive: true,
      });
    }
  }

  // Only add brand breadcrumb if we have the data or it's loading
  if (brandId) {
    if (brandData) {
      breadcrumbItems.push({
        label: brandData.name,
        href: `/brands/${brandData.slug}`,
        icon: <Package2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />,
        isActive: true,
      });
    } else if (isLoading) {
      breadcrumbItems.push({
        label: "Loading...",
        icon: <Package2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />,
        isActive: true,
      });
    }
  }

  return <PageBreadcrumb items={breadcrumbItems} />;
}
