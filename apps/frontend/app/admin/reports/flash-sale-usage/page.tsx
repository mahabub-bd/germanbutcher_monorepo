import { FlashSaleUsageReport } from "@/components/admin/reports/flash-sale-usage-report";

interface ResolvedSearchParams {
  [key: string]: string | string[] | undefined;
}

interface Props {
  searchParams: Promise<ResolvedSearchParams>;
}

export default async function FlashSaleUsageReportPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const preset =
    typeof resolvedParams.preset === "string" ? resolvedParams.preset : "this_month";
  const fromDate =
    typeof resolvedParams.fromDate === "string" ? resolvedParams.fromDate : undefined;
  const toDate =
    typeof resolvedParams.toDate === "string" ? resolvedParams.toDate : undefined;

  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <FlashSaleUsageReport
        initialPreset={preset}
        initialFromDate={fromDate}
        initialToDate={toDate}
      />
    </div>
  );
}

export const dynamic = "force-dynamic";
