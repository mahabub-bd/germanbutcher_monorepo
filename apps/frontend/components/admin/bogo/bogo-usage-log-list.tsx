"use client";

import { Gift } from "lucide-react";
import { MarketingUsageLogList } from "../marketing/usage-log-list";

interface BogoUsageLogListProps {
  initialPage?: number;
  initialLimit?: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

export function BogoUsageLogList({
  initialPage,
  initialLimit,
  initialSearchParams,
}: BogoUsageLogListProps) {
  return (
    <MarketingUsageLogList
      endpoint="bogo-usage-logs"
      title="BOGO Usage Logs"
      description="Which customer got which BOGO discount, and what it took off the order."
      emptyHint="Each time a customer's order is priced by a BOGO campaign, it will be logged here."
      icon={Gift}
      valueLabel="Discount"
      valueKey="discountAmount"
      negateValue
      initialPage={initialPage}
      initialLimit={initialLimit}
      initialSearchParams={initialSearchParams}
    />
  );
}
