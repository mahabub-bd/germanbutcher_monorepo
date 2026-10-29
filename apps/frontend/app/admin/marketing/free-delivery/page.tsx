"use client";

import { FreeDeliveryCampaignsCard } from "@/components/admin/marketing/free-delivery/free-delivery-campaigns-card";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function FreeDeliveryCampaignsPage() {
  return (
    <AdminPageContainer>

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
       
      </div>

      <FreeDeliveryCampaignsCard />

    </AdminPageContainer>
  );
}
