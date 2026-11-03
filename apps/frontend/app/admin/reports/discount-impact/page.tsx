export const dynamic = "force-dynamic";

import { AdminPageContainer } from "@/components/admin/admin-page-container";
import DiscountImpactList from "@/components/admin/reports/discount-impact/discount-impact-list";
import { fetchProtectedData } from "@/utils/api-utils";

interface ResolvedSearchParams {
  [key: string]: string | string[] | undefined;
}

interface Props {
  searchParams: Promise<ResolvedSearchParams>;
}

export default async function DiscountImpactReportPage({
  searchParams,
}: Props) {
  const resolvedParams = await searchParams;

  const fromDate =
    typeof resolvedParams.fromDate === "string"
      ? resolvedParams.fromDate
      : undefined;
  const toDate =
    typeof resolvedParams.toDate === "string" ? resolvedParams.toDate : undefined;
  // Only fall back to a preset when the URL has no explicit date range,
  // otherwise manual fromDate/toDate would be ignored below.
  const preset =
    typeof resolvedParams.preset === "string"
      ? resolvedParams.preset
      : fromDate || toDate
        ? undefined
        : "this_month";

  let reportData: {
    summary: {
      totalOrders: number;
      discountedOrders: number;
      totalDiscount: number;
      totalOrderValue: number;
      totalCouponAmount: number;
      totalCouponUses: number;
      totalBogoAmount: number;
      totalBogoUses: number;
      totalFlashAmount: number;
      totalFlashUses: number;
      discountSharePct: number;
    };
    days: {
      date: string;
      orders: number;
      discountedOrders: number;
      discountAmount: number;
      orderValue: number;
      couponAmount: number;
      couponUses: number;
      bogoAmount: number;
      bogoUses: number;
      flashAmount: number;
      flashUses: number;
      discountSharePct: number;
    }[];
  } | null = null;

  try {
    const queryParams = new URLSearchParams();
    if (preset) queryParams.append("preset", preset);
    else {
      if (fromDate) queryParams.append("fromDate", fromDate);
      if (toDate) queryParams.append("toDate", toDate);
    }

    const endpoint = `orders/reports/discount-impact${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    reportData = await fetchProtectedData(endpoint);
  } catch (error) {
    console.error("Failed to fetch discount impact report:", error);
  }

  return (
    <AdminPageContainer>
      <DiscountImpactList
        fromDate={fromDate}
        toDate={toDate}
        preset={preset}
        summary={reportData?.summary ?? null}
        days={reportData?.days ?? []}
      />
    </AdminPageContainer>
  );
}
