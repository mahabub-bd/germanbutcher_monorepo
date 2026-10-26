import { BogoUsageReport } from "@/components/admin/reports/bogo-usage-report";

interface ResolvedSearchParams {
  [key: string]: string | string[] | undefined;
}

interface Props {
  searchParams: Promise<ResolvedSearchParams>;
}

export default async function BogoUsageReportPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const preset =
    typeof resolvedParams.preset === "string" ? resolvedParams.preset : "this_month";
  const fromDate =
    typeof resolvedParams.fromDate === "string" ? resolvedParams.fromDate : undefined;
  const toDate =
    typeof resolvedParams.toDate === "string" ? resolvedParams.toDate : undefined;

  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <BogoUsageReport
        initialPreset={preset}
        initialFromDate={fromDate}
        initialToDate={toDate}
      />
    </div>
  );
}

export const dynamic = "force-dynamic";
