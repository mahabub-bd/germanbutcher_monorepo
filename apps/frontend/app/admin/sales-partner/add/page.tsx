"use client"

import { SalesPartnerForm } from "@/components/admin/sales-partner/sales-partner-form"
import { FormPageHeader } from "@/components/admin/form-page-header";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function AddSalesPartnerPage() {
  return (
    <AdminPageContainer>
        <FormPageHeader
        title="Add New Sales Partner"
        description="Create a new sales partner. Fill in all the required information."
        backHref="/admin/sales-partner/sales-partner-list"
        backLabel="Back to Sales Partners"
      />
      <div>
        <SalesPartnerForm mode="create" />
      </div>
    </AdminPageContainer>
  )
}
