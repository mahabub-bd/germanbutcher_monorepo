"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { Percent } from "lucide-react";
import type { ConversionData } from "@/utils/types";

interface ConversionCardProps {
  data: ConversionData;
}

export function ConversionCard({ data }: ConversionCardProps) {
  return (
    <StatsCard
      title="Conversion"
      value={`${data.conversionRate.toFixed(2)}%`}
      icon={Percent}
      bgColor="green"
      description={`${data.orders.toLocaleString()} orders · ${data.visitors.toLocaleString()} visitors`}
    />
  );
}
