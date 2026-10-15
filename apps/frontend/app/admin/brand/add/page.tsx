"use client";

import { BrandForm } from "@/components/admin/brand/brand-form";
import { FormPageHeader } from "@/components/admin/form-page-header";

export default function AddBrandPage() {
  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
        <FormPageHeader
        title="Add New Brand"
        description="Create a new brand. Fill in all the required information."
        backHref="/admin/brand/brand-list"
        backLabel="Back to Brands"
      />
      <div>
        <BrandForm mode="create" />
      </div>
    </div>
  );
}
