"use client";

import { CategoryForm } from "@/components/admin/category/category-form";
import { FormPageHeader } from "@/components/admin/form-page-header";

export default function AddCategoryPage() {
  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <FormPageHeader
        backHref="/admin/categories/categories-list"
        backLabel="Back to Categories"
      />
      <CategoryForm mode="create" />
    </div>
  );
}
