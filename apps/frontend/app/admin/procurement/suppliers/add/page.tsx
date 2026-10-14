"use client";

import { List, Plus } from "lucide-react";

import { RouteTabs } from "@/components/admin/route-tabs";
import { SupplierForm } from "@/components/admin/procurement/suppliers/supplier-form";

export default function AddSupplierPage() {
  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <div className="flex justify-end">
        <RouteTabs
          tabs={[
            {
              label: "Suppliers",
              href: "/admin/procurement/suppliers",
              icon: <List className="mr-2 h-4 w-4" />,
            },
            {
              label: "Add Supplier",
              href: "/admin/procurement/suppliers/add",
              icon: <Plus className="mr-2 h-4 w-4" />,
            },
          ]}
        />
      </div>
      <SupplierForm mode="create" />
    </div>
  );
}
