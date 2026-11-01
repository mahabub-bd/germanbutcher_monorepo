"use client";

import { AdminPageContainer } from "@/components/admin/admin-page-container";
import { CategoryForm } from "@/components/admin/category/category-form";
import { FormPageHeader } from "@/components/admin/form-page-header";

export default function AddCategoryPage() {
  return (
    <AdminPageContainer>
      <FormPageHeader
        title="Add New Category"
        description="Create a new category. Fill in all the required information."
        backHref="/admin/categories/categories-list"
        backLabel="Back to Categories"
      />
      <CategoryForm mode="create" />
    </AdminPageContainer>
  );
}
