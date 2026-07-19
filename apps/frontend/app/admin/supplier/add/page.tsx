"use client";

import { SupplierForm } from "@/components/admin/supplier/supplier-form";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function AddSupplierPage() {
  return (
    <div className="md:p-6 p:2 space-y-6 border rouunded-sm">
      <div className="md:p-6 p:2">
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Add New Supplier</CardTitle>
            <CardDescription>
              Create a new supplier. Fill in all the required information.
            </CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/supplier/supplier-list">Back to Suppliers</Link>
          </Button>
        </div>
      </div>
      <div>
        <SupplierForm mode="create" />
      </div>
    </div>
  );
}
