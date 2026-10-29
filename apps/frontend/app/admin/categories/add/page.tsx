"use client";

import { CategoryForm } from "@/components/admin/category/category-form";
import { FormPageHeader } from "@/components/admin/form-page-header";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function AddCategoryPage() {
  return (
    <AdminPageContainer>
      <FormPageHeader
        backHref="/admin/categories/categories-list"
        backLabel="Back to Categories"
      />
      <CategoryForm mode="create" />
    </AdminPageContainer>
  );
}
