"use client";

import { SupplierForm } from "@/components/admin/procurement/suppliers/supplier-form";
import { FormPageHeader } from "@/components/admin/form-page-header";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function AddSupplierPage() {
  return (
    <AdminPageContainer>
      <FormPageHeader
        title="Add New Supplier"
        description="Create a new supplier. Fill in all the required information."
        backHref="/admin/procurement/suppliers/suppliers-list"
        backLabel="Back to Suppliers"
      />
      <SupplierForm mode="create" />
    </AdminPageContainer>
  );
}
