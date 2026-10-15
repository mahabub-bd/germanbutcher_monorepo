"use client"

import { ClientForm } from "@/components/admin/client/client-form"
import { FormPageHeader } from "@/components/admin/form-page-header";

export default function AddClientPage() {
  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
        <FormPageHeader
        title="Add New Client"
        description="Create a new client. Fill in all the required information."
        backHref="/admin/client/client-list"
        backLabel="Back to Clients"
      />
      <div>
        <ClientForm mode="create" />
      </div>
    </div>
  )
}
