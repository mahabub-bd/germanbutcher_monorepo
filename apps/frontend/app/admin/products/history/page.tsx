import ProductActivityHistory from "@/components/admin/products/product-activity-history";
import { PageHeader } from "@/components/admin/page-header";
import { History } from "lucide-react";

export const metadata = {
  title: "Product History",
};

export default function ProductHistoryPage() {
  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <PageHeader
        title="Product History"
        description="Audit trail of every product change: added, edited, activated, deactivated and deleted — newest first."
        titleIcon={<History className="size-6" />}
      />
      <ProductActivityHistory />
    </div>
  );
}
