"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import type { AnalyticsOverview } from "@/utils/types";
import {
  Activity,
  Clock,
  Globe,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

interface AnalyticsOverviewCardsProps {
  data: AnalyticsOverview;
}

export function AnalyticsOverviewCards({ data }: AnalyticsOverviewCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatsCard
        title="Total Requests"
        value={data.totalRequests.toLocaleString()}
        icon={Activity}
        bgColor="blue"
      />
      <StatsCard
        title="Unique Visitors"
        value={data.uniqueVisitors.toLocaleString()}
        icon={Users}
        bgColor="green"
      />
      <StatsCard
        title="Avg Response Time"
        value={`${data.avgResponseTime.toFixed(0)}ms`}
        icon={Clock}
        bgColor="purple"
      />
      <StatsCard
        title="Requests/Min"
        value={data.requestsPerMinute.toFixed(1)}
        icon={Zap}
        bgColor="amber"
      />
      <StatsCard
        title="Peak Hour"
        value={data.peakHour}
        icon={TrendingUp}
        description="Highest traffic"
        bgColor="indigo"
      />
      <StatsCard
        title="Top Endpoint"
        value={data.topEndpoint.split(" ").slice(0, 2).join(" ")}
        icon={Globe}
        description="Most accessed"
        bgColor="violet"
      />
    </div>
  );
}
