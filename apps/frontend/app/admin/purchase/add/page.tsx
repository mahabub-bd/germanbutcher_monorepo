"use client";

import { PurchaseForm } from "@/components/admin/purchase/purchase-form";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function AddPurchasePage() {
  return (
    <div className="md:p-6 p-2 space-y-6 border rounded-sm">
      <div className="md:p-6 p-2">
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Add New Purchase</CardTitle>
            <CardDescription>
              Create a new purchase record. Fill in all the required
              information.
            </CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/purchase/purchase-list">Back to Purchases</Link>
          </Button>
        </div>
      </div>
      <div>
        <PurchaseForm mode="create" />
      </div>
    </div>
  );
}
