"use client";

import { PurchaseForm } from "@/components/admin/procurement/purchases/purchase-form";
import { FormPageHeader } from "@/components/admin/form-page-header";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function AddPurchasePage() {
  return (
    <AdminPageContainer>
      <FormPageHeader
        title="Add New Purchase"
        description="Create a new purchase. Fill in all the required information."
        backHref="/admin/procurement/purchases/purchases-list"
        backLabel="Back to Purchases"
      />
      <PurchaseForm mode="create" />
    </AdminPageContainer>
  );
}
