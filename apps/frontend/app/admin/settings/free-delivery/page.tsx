"use client";

import { FreeDeliverySettingsCard } from "@/components/admin/shipping-method/free-delivery-settings-card";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Truck } from "lucide-react";
import Link from "next/link";

export default function FreeDeliverySettingsPage() {
  return (
    <div className="md:p-6 p-2 space-y-6 border rounded-sm">
      <div className="md:p-6 p-2">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-primaryColor dark:bg-red-950/40 dark:text-red-400">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Free Delivery Settings</CardTitle>
              <CardDescription>
                Waive the delivery fee for orders above a minimum amount.
              </CardDescription>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/settings/shipping-method">
              Back to Shipping Methods
            </Link>
          </Button>
        </div>
      </div>

      <FreeDeliverySettingsCard />
    </div>
  );
}
