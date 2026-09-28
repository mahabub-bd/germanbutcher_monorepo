"use client";

import { FreeDeliveryCampaignsCard } from "@/components/admin/shipping-method/free-delivery-campaigns-card";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Truck } from "lucide-react";

export default function FreeDeliveryCampaignsPage() {
  return (
    <div className="md:p-4 p-2 border rounded-sm">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-primaryColor dark:bg-red-950/40 dark:text-red-400">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <CardTitle>Free Delivery Campaigns</CardTitle>
            <CardDescription>
              Scheduled free delivery with product/category, day/time and
              new-customer conditions.
            </CardDescription>
          </div>
        </div>
      </div>

      <FreeDeliveryCampaignsCard />

    </div>
  );
}
