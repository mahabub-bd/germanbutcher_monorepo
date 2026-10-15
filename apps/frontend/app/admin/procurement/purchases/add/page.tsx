"use client";

import { PurchaseForm } from "@/components/admin/procurement/purchases/purchase-form";
import { FormPageHeader } from "@/components/admin/form-page-header";

export default function AddPurchasePage() {
  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <FormPageHeader
        title="Add New Purchase"
        description="Create a new purchase. Fill in all the required information."
        backHref="/admin/procurement/purchases"
        backLabel="Back to Purchases"
      />
      <PurchaseForm mode="create" />
    </div>
  );
}
