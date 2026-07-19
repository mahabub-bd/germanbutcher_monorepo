import CustomerListReport from "@/components/admin/reports/customer-list/customer-list";
import { fetchProtectedData } from "@/utils/api-utils";

interface ResolvedSearchParams {
  [key: string]: string | string[] | undefined;
}

interface Props {
  searchParams: Promise<ResolvedSearchParams>;
}

export default async function CustomerListReportPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const fromDate =
    typeof resolvedParams.fromDate === "string"
      ? resolvedParams.fromDate
      : undefined;
  const toDate =
    typeof resolvedParams.toDate === "string"
      ? resolvedParams.toDate
      : undefined;
  const preset =
    typeof resolvedParams.preset === "string"
      ? resolvedParams.preset
      : "this_month";

  let reportData: any = null;

  try {
    const queryParams = new URLSearchParams();
    if (preset) {
      queryParams.append("preset", preset);
    } else {
      if (fromDate) queryParams.append("fromDate", fromDate);
      if (toDate) queryParams.append("toDate", toDate);
    }

    const endpoint = `users/reports/customer-list${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    const response = await fetchProtectedData(endpoint);
    reportData = response || null;
  } catch (error) {
    console.error("❌ Failed to fetch customer list report:", error);
    reportData = null;
  }

  const customers = reportData?.customers || [];
  const summary = reportData?.summary || {
    totalCustomers: 0,
    totalOrders: 0,
    totalOrderValue: 0,
  };

  // Add from/to from API response to summary for PDF date range
  const summaryWithDates = {
    ...summary,
    from: reportData?.from || fromDate,
    to: reportData?.to || toDate,
  };

  return (
    <div className="p-4 md:p-6">
      <CustomerListReport
        customers={customers}
        fromDate={fromDate}
        toDate={toDate}
        preset={preset}
        summary={summaryWithDates}
      />
    </div>
  );
}
