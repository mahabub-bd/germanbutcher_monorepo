export const dynamic = "force-dynamic";

import { FreeDeliveryUsageReport } from "@/components/admin/reports/free-delivery-usage-report";

interface ResolvedSearchParams {
  [key: string]: string | string[] | undefined;
}

interface Props {
  searchParams: Promise<ResolvedSearchParams>;
}

export default async function FreeDeliveryUsageReportPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const preset =
    typeof resolvedParams.preset === "string" ? resolvedParams.preset : undefined;
  const fromDate =
    typeof resolvedParams.fromDate === "string" ? resolvedParams.fromDate : undefined;
  const toDate =
    typeof resolvedParams.toDate === "string" ? resolvedParams.toDate : undefined;

  return (
    <div className="border rounded-sm">
      <FreeDeliveryUsageReport
        initialPreset={preset}
        initialFromDate={fromDate}
        initialToDate={toDate}
      />
    </div>
  );
}
