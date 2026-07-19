"use client";

import { CategoryForm } from "@/components/admin/category/category-form";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function AddCategoryPage() {
  return (
    <div className="md:p-6 p:2 space-y-6 border rouunded-sm">
      <div className="md:p-6 p:2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Add New Category</CardTitle>
            <CardDescription>
              Create a new category. Fill in all the required information.
            </CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/categories/categories-list">
              Back to Categories
            </Link>
          </Button>
        </div>
      </div>

      <CategoryForm mode="create" />
    </div>
  );
}
