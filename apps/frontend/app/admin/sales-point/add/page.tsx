"use client";

import { SalesPointForm } from "@/components/admin/sales-point/sales-point-form";
import { FormPageHeader } from "@/components/admin/form-page-header";

export default function AddSalesPointPage() {
  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
        <FormPageHeader
        title="Add New Sales Point"
        description="Create a new sales point. Fill in all the required information."
        backHref="/admin/sales-point/sales-point-list"
        backLabel="Back to Sales Points"
      />
      <div>
        <SalesPointForm mode="create" />
      </div>
    </div>
  );
}
