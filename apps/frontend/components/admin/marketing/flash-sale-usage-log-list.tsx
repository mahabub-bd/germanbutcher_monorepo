"use client";

import { Zap } from "lucide-react";
import { MarketingUsageLogList } from "./usage-log-list";

interface FlashSaleUsageLogListProps {
  initialPage?: number;
  initialLimit?: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

export function FlashSaleUsageLogList({
  initialPage,
  initialLimit,
  initialSearchParams,
}: FlashSaleUsageLogListProps) {
  return (
    <MarketingUsageLogList
      endpoint="flash-sale-usage-logs"
      title="Flash Sale Usage Logs"
      description="Which customer got which flash sale discount, and what it took off the order."
      emptyHint="Each time a customer's order is priced by a flash sale campaign, it will be logged here."
      icon={Zap}
      valueLabel="Discount"
      valueKey="discountAmount"
      negateValue
      initialPage={initialPage}
      initialLimit={initialLimit}
      initialSearchParams={initialSearchParams}
    />
  );
}
