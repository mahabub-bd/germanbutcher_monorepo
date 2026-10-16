import { AbandonedCartsList } from "@/components/admin/reports/abandoned-carts-list";
import { PageHeader } from "@/components/admin/page-header";
import { ShoppingCart } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AbandonedCartsReportPage() {
  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <PageHeader
        title="Abandoned Carts"
        description="Carts with items that were never checked out (inactive 24h+)"
        titleIcon={<ShoppingCart className="size-6 text-primaryColor" />}
      />
      <AbandonedCartsList />
    </div>
  );
}
