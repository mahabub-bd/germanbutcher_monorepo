"use client";

import {
  AnalyticsOverviewCards,
  PeakTrafficChart,
  RequestsChart,
  ResponseTimesChart,
  TopEndpointsTable,
  VisitorsChart,
} from "@/components/admin/analytics";
import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { PageHeader } from "@/components/admin/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchAllAnalyticsData } from "@/utils/analytics-utils";
import type { AnalyticsDashboardData, AnalyticsPeriod } from "@/utils/types";
import { useEffect, useState } from "react";

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("24h");
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const analyticsData = await fetchAllAnalyticsData(period);
        setData(analyticsData);
      } catch (err) {
        console.error("Error loading analytics:", err);
        setError("Failed to load analytics data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [period]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Analytics Dashboard"
          description="Monitor your API performance and traffic"
        />
        <Select
          value={period}
          onValueChange={(value) => setPeriod(value as AnalyticsPeriod)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">Last Hour</SelectItem>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingIndicator message="Loading analytics data..." />
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          <AnalyticsOverviewCards data={data.overview} />

          <div className="grid gap-6 lg:grid-cols-2">
            <RequestsChart data={data.requests} />
            <VisitorsChart data={data.visitors} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <PeakTrafficChart data={data.peakTraffic} />
            <ResponseTimesChart data={data.responseTimes} />
          </div>

          <TopEndpointsTable data={data.topEndpoints} />
        </div>
      ) : null}
    </div>
  );
}
