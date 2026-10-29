"use client";

import { SalesPointForm } from "@/components/admin/sales-point/sales-point-form";
import { FormPageHeader } from "@/components/admin/form-page-header";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function AddSalesPointPage() {
  return (
    <AdminPageContainer>
        <FormPageHeader
        title="Add New Sales Point"
        description="Create a new sales point. Fill in all the required information."
        backHref="/admin/sales-point/sales-point-list"
        backLabel="Back to Sales Points"
      />
      <div>
        <SalesPointForm mode="create" />
      </div>
    </AdminPageContainer>
  );
}
