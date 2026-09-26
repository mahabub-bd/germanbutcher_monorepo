"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { ProductForm } from "@/components/admin/products/product-form";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-6 p-2 md:p-6">
      <div className="flex justify-end">
        <Button asChild variant="outline">
          <Link href="/admin/products/products-list">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>
      </div>
      <ProductForm mode="create" brands={brands} categories={categories} />
    </div>
  );
}
