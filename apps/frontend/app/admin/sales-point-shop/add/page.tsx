"use client";

import { ShopForm } from "@/components/admin/sales-point-shop/shop-form";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function AddShopPage() {
  return (
    <div className="md:p-6 p-2 space-y-6 border rounded-sm">
      <div className="md:p-6 p-2">
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Add New Shop</CardTitle>
            <CardDescription>
              Create a new shop for a sales point. Fill in all the required
              information.
            </CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/sales-point-shop/sales-point-shop-list">
              Back to Shops
            </Link>
          </Button>
        </div>
      </div>
      <div>
        <ShopForm mode="create" />
      </div>
    </div>
  );
}
