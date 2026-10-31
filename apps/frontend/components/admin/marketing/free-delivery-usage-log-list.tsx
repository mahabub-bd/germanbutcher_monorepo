"use client";

import { Truck } from "lucide-react";
import { MarketingUsageLogList } from "./usage-log-list";

interface FreeDeliveryUsageLogListProps {
  initialPage?: number;
  initialLimit?: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

export function FreeDeliveryUsageLogList({
  initialPage,
  initialLimit,
  initialSearchParams,
}: FreeDeliveryUsageLogListProps) {
  return (
    <MarketingUsageLogList
      endpoint="free-delivery-usage-logs"
      title="Free Delivery Usage Logs"
      description="Which customer used which free delivery campaign, and what the shipping would have cost."
      emptyHint="Each time a customer's order gets free delivery from a campaign, it will be logged here."
      icon={Truck}
      valueLabel="Shipping waived"
      valueKey="shippingWaived"
      initialPage={initialPage}
      initialLimit={initialLimit}
      initialSearchParams={initialSearchParams}
    />
  );
}
