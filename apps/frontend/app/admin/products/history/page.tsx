import ProductActivityHistory from "@/components/admin/products/product-activity-history";
import { PageHeader } from "@/components/admin/page-header";
import { ArrowLeft, History } from "lucide-react";

export const metadata = {
  title: "Product History",
};

export default function ProductHistoryPage() {
  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <PageHeader
        title="Product History"
        titleIcon={<History className="size-6" />}
        actionLabel="Back to Products"
        actionHref="/admin/products/products-list"
        actionIcon={<ArrowLeft className="mr-2 h-4 w-4" />}
      />
      <ProductActivityHistory />
    </div>
  );
}
