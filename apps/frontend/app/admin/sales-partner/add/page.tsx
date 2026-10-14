"use client"

import { SalesPartnerForm } from "@/components/admin/sales-partner/sales-partner-form"
import { FormPageHeader } from "@/components/admin/form-page-header";

export default function AddSalesPartnerPage() {
  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
        <FormPageHeader
        title="Add New Sales Partner"
        description="Create a new sales partner. Fill in all the required information."
        backHref="/admin/sales-partner/sales-partner-list"
        backLabel="Back to Sales Partners"
      />
      <div>
        <SalesPartnerForm mode="create" />
      </div>
    </div>
  )
}
