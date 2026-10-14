"use client";

import { ShopForm } from "@/components/admin/sales-point-shop/shop-form";
import { FormPageHeader } from "@/components/admin/form-page-header";

export default function AddShopPage() {
  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
        <FormPageHeader
        title="Add New Shop"
        description="Create a new shop for a sales point. Fill in all the required information."
        backHref="/admin/sales-point-shop/sales-point-shop-list"
        backLabel="Back to Shops"
      />
      <div>
        <ShopForm mode="create" />
      </div>
    </div>
  );
}
