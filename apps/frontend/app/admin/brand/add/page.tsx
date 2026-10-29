"use client";

import { BrandForm } from "@/components/admin/brand/brand-form";
import { FormPageHeader } from "@/components/admin/form-page-header";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function AddBrandPage() {
  return (
    <AdminPageContainer>
        <FormPageHeader
        title="Add New Brand"
        description="Create a new brand. Fill in all the required information."
        backHref="/admin/brand/brand-list"
        backLabel="Back to Brands"
      />
      <div>
        <BrandForm mode="create" />
      </div>
    </AdminPageContainer>
  );
}
