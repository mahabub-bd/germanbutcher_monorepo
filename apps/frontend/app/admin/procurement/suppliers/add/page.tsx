"use client";

import { SupplierForm } from "@/components/admin/procurement/suppliers/supplier-form";
import { FormPageHeader } from "@/components/admin/form-page-header";

export default function AddSupplierPage() {
  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <FormPageHeader
        title="Add New Supplier"
        description="Create a new supplier. Fill in all the required information."
        backHref="/admin/procurement/suppliers"
        backLabel="Back to Suppliers"
      />
      <SupplierForm mode="create" />
    </div>
  );
}
