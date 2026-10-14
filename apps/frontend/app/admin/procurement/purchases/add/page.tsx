"use client";

import { List, Plus } from "lucide-react";

import { RouteTabs } from "@/components/admin/route-tabs";
import { PurchaseForm } from "@/components/admin/procurement/purchases/purchase-form";

export default function AddPurchasePage() {
  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <RouteTabs
        tabs={[
          {
            label: "Purchases",
            href: "/admin/procurement/purchases",
            icon: <List className="mr-2 h-4 w-4" />,
          },
          {
            label: "Add Purchase",
            href: "/admin/procurement/purchases/add",
            icon: <Plus className="mr-2 h-4 w-4" />,
          },
        ]}
      />
      <PurchaseForm mode="create" />
    </div>
  );
}
