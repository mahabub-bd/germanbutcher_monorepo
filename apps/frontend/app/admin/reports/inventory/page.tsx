export const dynamic = "force-dynamic";

import InventoryList from "@/components/admin/reports/inventory/inventory-list";
import { fetchProtectedData } from "@/utils/api-utils";

export default async function InventoryReportPage() {
  let reportData: {
    summary: {
      totalProducts: number;
      totalUnits: number;
      stockValueCost: number;
      stockValueRetail: number;
      outOfStock: number;
      lowStock: number;
    };
    products: {
      id: number;
      name: string;
      slug: string;
      stock: number;
      purchasePrice: number;
      sellingPrice: number;
      stockStatus: "out" | "low" | "ok";
    }[];
  } | null = null;

  try {
    reportData = await fetchProtectedData("products/reports/stock-valuation");
  } catch (error) {
    console.error("Failed to fetch inventory report:", error);
  }

  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <InventoryList
        summary={reportData?.summary ?? null}
        products={reportData?.products ?? []}
      />
    </div>
  );
}
