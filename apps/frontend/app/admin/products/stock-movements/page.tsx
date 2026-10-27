import StockMovementHistory from "@/components/admin/products/stock-movement-history";
import { PageHeader } from "@/components/admin/page-header";
import { ArrowLeftRight } from "lucide-react";

export const metadata = {
  title: "Stock Movements",
};

export default function StockMovementsPage() {
  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <PageHeader
        title="Stock Movements"
        titleIcon={<ArrowLeftRight className="size-6" />}
      />
      <StockMovementHistory />
    </div>
  );
}
