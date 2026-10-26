"use client";

import {
  AnalyticsOverviewCards,
  DeviceChart,
  PeakTrafficResponseCard,
  RequestsChart,
  TopEndpointsTable,
  TopProductPagesCard,
  TrafficSourcesCard,
  VisitorsChart,
} from "@/components/admin/analytics";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAllAnalyticsData } from "@/utils/analytics-utils";
import type { AnalyticsDashboardData, AnalyticsPeriod } from "@/utils/types";
import {
  AlertTriangle,
  BarChart3,
  CalendarRange,
  Clock3,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";

const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  "1h": "1 hour",
  "24h": "24 hours",
  "7d": "7 days",
  "15d": "15 days",
  "30d": "30 days",
};

// These panels intentionally aggregate over longer, fixed windows so the
// charts keep a useful sample size. Surface the window so it is never
// confused with the selector at the top of the page.
const FIXED_RANGES = {
  visitors: "30 days",
  peakTraffic: "7 days",
  topPages: "7 days",
  trafficSources: "30 days",
  conversion: "30d",
} as const;

function AnalyticsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-8">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-25 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Skeleton className="h-95 rounded-sm xl:col-span-6" />
        <Skeleton className="h-95 rounded-sm xl:col-span-6" />
        <Skeleton className="h-95 rounded-sm xl:col-span-6 2xl:col-span-4" />
        <Skeleton className="h-95 rounded-sm xl:col-span-6 2xl:col-span-4" />
        <Skeleton className="h-60 rounded-sm xl:col-span-12 2xl:col-span-4" />
        <Skeleton className="h-110 rounded-sm xl:col-span-12 2xl:col-span-5" />
        <Skeleton className="h-110 rounded-sm xl:col-span-12 2xl:col-span-7" />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("24h");
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const analyticsData = await fetchAllAnalyticsData(period);
        if (!cancelled) {
          setData(analyticsData);
          setLastUpdated(new Date());
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error loading analytics:", err);
          setError("Failed to load analytics data. Please try again.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [period, refreshKey]);

  const refresh = () => setRefreshKey((key) => key + 1);
  const periodLabel = PERIOD_LABELS[period];
  const showSkeleton = isLoading && !data;
  const showErrorState = Boolean(error) && !data;

  return (
    <div className="space-y-4 p-2 md:p-4">
      <PageHeader
        className="mb-4"
        title="Analytics Dashboard"
        description="Monitor API traffic, visitor behaviour, and response health"
        titleIcon={
          <span className="flex size-9 items-center justify-center rounded-xl bg-primaryColor/10 text-primaryColor ring-1 ring-primaryColor/15">
            <BarChart3 className="size-5" />
          </span>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          {lastUpdated && (
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground lg:flex">
              <Clock3 className="size-3.5" />
              Updated{" "}
              {lastUpdated.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          )}
          <Select
            value={period}
            onValueChange={(value) => setPeriod(value as AnalyticsPeriod)}
          >
            <SelectTrigger className="w-40">
              <CalendarRange className="size-4 text-muted-foreground" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last hour</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="15d">Last 15 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            aria-label="Refresh analytics"
            title="Refresh analytics"
            onClick={refresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={isLoading ? "size-4 animate-spin" : "size-4"}
            />
          </Button>
        </div>
      </PageHeader>

      {showSkeleton ? (
        <AnalyticsSkeleton />
      ) : showErrorState ? (
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </span>
            <div>
              <p className="font-medium">Could not load analytics</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
            <Button variant="outline" onClick={refresh}>
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : data ? (
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{error} Showing the last successful snapshot.</span>
            </div>
          )}

          <AnalyticsOverviewCards
            data={data.overview}
            conversion={data.conversion}
            requestsSeries={data.requests.map((r) => r.count)}
            visitorsSeries={data.visitors.map((v) => v.count)}
            conversionRangeLabel={FIXED_RANGES.conversion}
          />

          {/* Pair the two time-series charts, then use a 3-up audience row and
              a 5/7 detail row so every card has a neighbour on wide screens. */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-6">
              <RequestsChart
                data={data.requests}
                period={period}
                rangeLabel={periodLabel}
              />
            </div>
            <div className="xl:col-span-6">
              <VisitorsChart
                data={data.visitors}
                rangeLabel={FIXED_RANGES.visitors}
              />
            </div>

            <div className="xl:col-span-6 2xl:col-span-4">
              <TopProductPagesCard
                data={data.topPages}
                rangeLabel={FIXED_RANGES.topPages}
              />
            </div>
            <div className="xl:col-span-6 2xl:col-span-4">
              <DeviceChart
                data={data.devices}
                rangeLabel={periodLabel}
              />
            </div>
            <div className="xl:col-span-12 2xl:col-span-4">
              <TrafficSourcesCard
                data={data.trafficSources}
                rangeLabel={FIXED_RANGES.trafficSources}
              />
            </div>

            <div className="xl:col-span-12 2xl:col-span-5">
              <PeakTrafficResponseCard
                traffic={data.peakTraffic}
                responseTimes={data.responseTimes}
                rangeLabel={FIXED_RANGES.peakTraffic}
              />
            </div>
            <div className="xl:col-span-12 2xl:col-span-7">
              <TopEndpointsTable
                data={data.topEndpoints}
                rangeLabel={periodLabel}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
