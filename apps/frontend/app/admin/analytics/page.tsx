"use client";

import {
  AnalyticsOverviewCards,
  DeviceChart,
  PeakTrafficResponseCard,
  RequestsChart,
  TopEndpointsTable,
  TopProductPagesCard,
  TrafficSourcesCard,
  VisitorsChart
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
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Analytics Dashboard"
          description="Monitor your API performance and traffic"
        />
        <Select
          value={period}
          onValueChange={(value) => setPeriod(value as AnalyticsPeriod)}
        >
          <SelectTrigger className="w-35">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">Last Hour</SelectItem>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="15d">Last 15 Days</SelectItem>
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
        <div className="md:p-4 p-2 space-y-4 rounded-sm">
          <AnalyticsOverviewCards
            data={data.overview}
            conversion={data.conversion}
            requestsSeries={data.requests.map((r) => r.count)}
            visitorsSeries={data.visitors.map((v) => v.count)}
          />

          {/* Size-aware grid: dense charts get wider spans, list cards narrower */}
          <div className="grid gap-4 grid-cols-1 xl:grid-cols-12">
            <div className="xl:col-span-6">
              <RequestsChart data={data.requests} period={period} />
            </div>
            <div className="xl:col-span-6">
              <VisitorsChart data={data.visitors} />
            </div>

            <div className="xl:col-span-4">
              <TopProductPagesCard data={data.topPages} />
            </div>
            <div className="xl:col-span-5">
              <DeviceChart data={data.devices} />
            </div>
            <div className="xl:col-span-3">
              <TrafficSourcesCard data={data.trafficSources} />
            </div>

            <div className="xl:col-span-6">
              <PeakTrafficResponseCard
                traffic={data.peakTraffic}
                responseTimes={data.responseTimes}
              />
            </div>
            <div className="xl:col-span-6">
              <TopEndpointsTable data={data.topEndpoints} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
