"use client"

import { ClientForm } from "@/components/admin/client/client-form"
import { FormPageHeader } from "@/components/admin/form-page-header";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function AddClientPage() {
  return (
    <AdminPageContainer>
        <FormPageHeader
        title="Add New Client"
        description="Create a new client. Fill in all the required information."
        backHref="/admin/client/client-list"
        backLabel="Back to Clients"
      />
      <div>
        <ClientForm mode="create" />
      </div>
    </AdminPageContainer>
  )
}
