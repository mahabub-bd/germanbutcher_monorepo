import ProductActivityHistory from "@/components/admin/products/product-activity-history";
import { PageHeader } from "@/components/admin/page-header";
import { AdminPageContainer } from "@/components/admin/admin-page-container";
import { ArrowLeft, ArrowLeftRight, History } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Product History",
};

export default function ProductHistoryPage() {
  return (
    <AdminPageContainer>
      <PageHeader
        title="Product History"
        description="Audit trail of every product event — added, edited, activated, deactivated and deleted — with the field-level diff and who made it."
        titleIcon={<History className="size-6" />}
        actionLabel="Back to Products"
        actionHref="/admin/products/products-list"
        actionIcon={<ArrowLeft className="mr-2 h-4 w-4" />}
      >
        <Button asChild variant="outline">
          <Link href="/admin/products/stock-movements">
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Stock movements</span>
          </Link>
        </Button>
      </PageHeader>
      <ProductActivityHistory />
    </AdminPageContainer>
  );
}
