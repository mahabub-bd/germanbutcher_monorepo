"use client";

import { OnlineNowCard } from "@/components/admin/analytics/online-now-card";
import StatsCard from "@/components/admin/dashboard/stats-card";
import type { AnalyticsOverview, ConversionData } from "@/utils/types";
import {
  Activity,
  Clock,
  Globe,
  Percent,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

interface AnalyticsOverviewCardsProps {
  data: AnalyticsOverview;
  conversion?: ConversionData;
  /** Hourly request counts — drives the sparklines that have real data. */
  requestsSeries?: number[];
  /** Daily visitor counts — drives the visitors/conversion sparklines. */
  visitorsSeries?: number[];
}

export function AnalyticsOverviewCards({
  data,
  conversion,
  requestsSeries,
  visitorsSeries,
}: AnalyticsOverviewCardsProps) {
  // 8-across only on large desktops; laptops (xl) get 4x2 so the cards
  // keep readable widths
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-8">
      <OnlineNowCard />
      <StatsCard
        title="Total Requests"
        value={data.totalRequests.toLocaleString()}
        icon={Activity}
        bgColor="blue"
        sparklineData={requestsSeries}
      />
      <StatsCard
        title="Unique Visitors"
        value={data.uniqueVisitors.toLocaleString()}
        icon={Users}
        bgColor="green"
        sparklineData={visitorsSeries}
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
        sparklineData={requestsSeries}
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
      {conversion && (
        <StatsCard
          title="Conversion"
          value={`${conversion.conversionRate.toFixed(2)}%`}
          icon={Percent}
          bgColor="green"
          description={`${conversion.orders.toLocaleString()} orders / ${conversion.visitors.toLocaleString()} visitors`}
          sparklineData={visitorsSeries}
        />
      )}
    </div>
  );
}
