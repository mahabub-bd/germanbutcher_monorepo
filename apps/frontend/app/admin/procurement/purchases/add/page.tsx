"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { PurchaseForm } from "@/components/admin/procurement/purchases/purchase-form";
import { Button } from "@/components/ui/button";

export default function AddPurchasePage() {
  return (
    <div className="space-y-6 p-2 md:p-4">
      <div className="flex justify-end">
        <Button asChild variant="outline">
          <Link href="/admin/procurement/purchases">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Purchases
          </Link>
        </Button>
      </div>
      <PurchaseForm mode="create" />
    </div>
  );
}
