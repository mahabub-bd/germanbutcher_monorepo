export const dynamic = "force-dynamic";

import { FreeDeliveryUsageReport } from "@/components/admin/reports/free-delivery-usage-report";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

interface ResolvedSearchParams {
  [key: string]: string | string[] | undefined;
}

interface Props {
  searchParams: Promise<ResolvedSearchParams>;
}

export default async function FreeDeliveryUsageReportPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const preset =
    typeof resolvedParams.preset === "string" ? resolvedParams.preset : "this_month";
  const fromDate =
    typeof resolvedParams.fromDate === "string" ? resolvedParams.fromDate : undefined;
  const toDate =
    typeof resolvedParams.toDate === "string" ? resolvedParams.toDate : undefined;

  return (
    <AdminPageContainer>
      <FreeDeliveryUsageReport
        initialPreset={preset}
        initialFromDate={fromDate}
        initialToDate={toDate}
      />
    </AdminPageContainer>
  );
}
