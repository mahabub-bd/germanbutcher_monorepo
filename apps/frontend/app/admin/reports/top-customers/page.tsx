import TopCustomersReport from "@/components/admin/reports/top-customers/top-customers";
import { PageHeader } from "@/components/admin/page-header";
import { fetchProtectedData } from "@/utils/api-utils";

interface ResolvedSearchParams {
  [key: string]: string | string[] | undefined;
}

interface Props {
  searchParams: Promise<ResolvedSearchParams>;
}

type TimeFilter =
  | "this_month"
  | "last_3_months"
  | "last_6_months"
  | "last_year"
  | "this_year"
  | "all_time";

const TIME_FILTERS: TimeFilter[] = [
  "this_month",
  "last_3_months",
  "last_6_months",
  "last_year",
  "this_year",
  "all_time",
];

const LIMITS = [5, 10, 20, 50, 100];

export default async function TopCustomersReportPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;

  const parsedLimit = Number.parseInt(
    typeof resolvedParams.limit === "string" ? resolvedParams.limit : ""
  );
  const limit = LIMITS.includes(parsedLimit) ? parsedLimit : 10;

  const sortBy =
    resolvedParams.sortBy === "spending" ? "spending" : "orders";

  const rawTimeFilter =
    typeof resolvedParams.timeFilter === "string"
      ? resolvedParams.timeFilter
      : "";
  const timeFilter: TimeFilter = TIME_FILTERS.includes(
    rawTimeFilter as TimeFilter
  )
    ? (rawTimeFilter as TimeFilter)
    : "all_time";

  let customers: any[] = [];

  try {
    const response = await fetchProtectedData(
      `users/customers/top?limit=${limit}&sortBy=${sortBy}&timeFilter=${timeFilter}`
    );
    customers = Array.isArray(response) ? response : [];
  } catch (error) {
    console.error("❌ Failed to fetch top customers report:", error);
    customers = [];
  }

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Top Customers Report"
        description="Best customers by orders and spending"
      />
      <TopCustomersReport
        customers={customers}
        limit={limit}
        sortBy={sortBy}
        timeFilter={timeFilter}
      />
    </div>
  );
}
