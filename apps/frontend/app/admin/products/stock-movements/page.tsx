import { AdminPageContainer } from "@/components/admin/admin-page-container";
import { PageHeader } from "@/components/admin/page-header";
import StockMovementHistory from "@/components/admin/products/stock-movement-history";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Boxes } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Stock Movements",
};

export default function StockMovementsPage() {
  return (
    <AdminPageContainer>
      <PageHeader
        title="Stock Movements"
        description="Chronological ledger of every stock change — purchases in, sales out, reversals, cancelled-order restocks and manual adjustments."
        
        actionLabel="Back to Products"
        actionHref="/admin/products/products-list"
        actionIcon={<ArrowLeft className="mr-2 h-4 w-4" />}
      >
        <Button asChild variant="outline">
          <Link href="/admin/products/inventory">
            <Boxes className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Inventory</span>
          </Link>
        </Button>
      </PageHeader>
      <StockMovementHistory />
    </AdminPageContainer>
  );
}
