"use client";

import { CategoryForm } from "@/components/admin/category/category-form";
import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { fetchData } from "@/utils/api-utils";
import type { Category } from "@/utils/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditCategoryPage() {
  const params = useParams();
  const categoryId = params.id as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategory = async () => {
    try {
      const response = await fetchData<Category>(`categories/${categoryId}`);
      setCategory(response);
    } catch (error) {
      console.error("Error fetching category:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategory();
  }, [categoryId]);

  if (isLoading) {
    return <LoadingIndicator message="Loading Categories" />;
  }

  if (!category) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Category not found</p>
      </div>
    );
  }

  return (
    <div className="md:p-6 p:2 space-y-6 border rouunded-sm">
      <div className="md:p-6 p:2">
        <div className="flex justify-between items-center mt-6">
          <div>
            <CardTitle>Edit Category</CardTitle>
            <CardDescription>Update the category information.</CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/categories/categories-list">
              Back to Categories
            </Link>
          </Button>
        </div>
      </div>

      <CategoryForm mode="edit" category={category} />
    </div>
  );
}
