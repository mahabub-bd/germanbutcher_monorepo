"use client";

import { useEffect, useState } from "react";

import { FormPageHeader } from "@/components/admin/form-page-header";
import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { ProductForm } from "@/components/admin/products/product-form";
import { fetchData } from "@/utils/api-utils";
import type { Brand, Category } from "@/utils/types";

export default function AddProductPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBrands = async () => {
    try {
      const response = await fetchData<Brand[]>("brands");
      if (Array.isArray(response)) {
        setBrands(response);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetchData<Category[]>(
        "categories?isMainCategory=true"
      );
      if (Array.isArray(response)) {
        setCategories(response);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchBrands(), fetchCategories()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  if (isLoading) {
    return <LoadingIndicator message="Loading Products" />;
  }
  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <FormPageHeader
        backHref="/admin/products/products-list"
        backLabel="Back to Products"
      />
      <ProductForm mode="create" brands={brands} categories={categories} />
    </div>
  );
}
