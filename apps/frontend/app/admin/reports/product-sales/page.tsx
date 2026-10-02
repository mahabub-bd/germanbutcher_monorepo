export const dynamic = "force-dynamic";

import ProductSalesList from "@/components/admin/reports/product-sales/product-sales-list";
import { fetchProtectedData } from "@/utils/api-utils";

interface ResolvedSearchParams {
  [key: string]: string | string[] | undefined;
}

interface Props {
  searchParams: Promise<ResolvedSearchParams>;
}

export default async function ProductSalesReportPage({
  searchParams,
}: Props) {
  const resolvedParams = await searchParams;

  const fromDate =
    typeof resolvedParams.fromDate === "string"
      ? resolvedParams.fromDate
      : undefined;
  const toDate =
    typeof resolvedParams.toDate === "string" ? resolvedParams.toDate : undefined;
  const preset =
    typeof resolvedParams.preset === "string" ? resolvedParams.preset : undefined;

  let reportData: {
    summary: {
      totalRevenue: number;
      totalQuantity: number;
      productCount: number;
    };
    products: {
      id: number;
      name: string;
      slug: string;
      stock: number;
      quantity: number;
      revenue: number;
      orderCount: number;
    }[];
  } | null = null;

  try {
    const queryParams = new URLSearchParams();
    if (fromDate) queryParams.append("fromDate", fromDate);
    if (preset) queryParams.append("preset", preset);
    else {
      if (fromDate) queryParams.append("fromDate", fromDate);
      if (toDate) queryParams.append("toDate", toDate);
    }

    const endpoint = `products/reports/sales${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    reportData = await fetchProtectedData(endpoint);
  } catch (error) {
    console.error("Failed to fetch product sales report:", error);
  }

  return (
    <div className="p-4 md:p-6">
      <ProductSalesList
        preset={preset}
        fromDate={fromDate}
        toDate={toDate}
        summary={reportData?.summary ?? null}
        products={reportData?.products ?? []}
      />
    </div>
  );
}
