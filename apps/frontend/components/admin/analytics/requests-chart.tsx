"use client";

import { AnalyticsCardHeader, AnalyticsRangeBadge } from "@/components/admin/analytics/analytics-card-header";
import { AnalyticsEmptyState } from "@/components/admin/analytics/analytics-empty-state";
import { ChartTooltip } from "@/components/admin/analytics/chart-tooltip";
import { Card, CardContent } from "@/components/ui/card";
import type { AnalyticsPeriod, AnalyticsRequests } from "@/utils/types";
import { Activity } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface RequestsChartProps {
  data: AnalyticsRequests[];
  /** Kept for API symmetry; buckets are always hour-wise from the backend. */
  period?: AnalyticsPeriod;
  /** Aggregation window shown in the header, e.g. "24 hours". */
  rangeLabel?: string;
}

const REQUESTS_COLOR = "#6366f1"; // Indigo-500

export function RequestsChart({
  data,
  rangeLabel = "selected period",
}: RequestsChartProps) {
  const totalRequests = data.reduce((sum, item) => sum + item.count, 0);
  const avgRequests =
    data.length > 0 ? Math.round(totalRequests / data.length) : 0;
  const peak = data.reduce(
    (max, item) => (item.count > max.count ? item : max),
    data[0] ?? { time: "", count: 0 },
  );

  // With 24 hourly buckets a tick every other hour reads better than a
  // cramped full scale on half-width cards.
  const tickInterval = data.length > 12 ? Math.ceil(data.length / 12) - 1 : 0;

  if (!data || data.length === 0) {
    return (
      <Card className="h-full rounded-sm">
        <AnalyticsCardHeader
          title="Request Traffic"
          description="Hourly API request volume"
          icon={Activity}
          tone="blue"
          action={<AnalyticsRangeBadge label={rangeLabel} />}
        />
        <CardContent>
          <AnalyticsEmptyState
            icon={Activity}
            title="No request data yet"
            description="Hourly traffic will appear once requests are recorded"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full rounded-sm">
      <AnalyticsCardHeader
        title="Request Traffic"
        description={`${totalRequests.toLocaleString()} total · avg ${avgRequests.toLocaleString()}/hr`}
        icon={Activity}
        tone="blue"
        action={<AnalyticsRangeBadge label={rangeLabel} />}
      />
      <CardContent className="flex flex-1 flex-col gap-3">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="requestsGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={REQUESTS_COLOR}
                  stopOpacity={0.32}
                />
                <stop
                  offset="95%"
                  stopColor={REQUESTS_COLOR}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              opacity={0.2}
            />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              interval={tickInterval}
              minTickGap={24}
              tick={{ fontSize: 11, fill: "currentColor" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              width={44}
              tick={{ fontSize: 11, fill: "currentColor" }}
              tickFormatter={(value) =>
                value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value
              }
            />
            <Tooltip
              cursor={{ stroke: REQUESTS_COLOR, strokeOpacity: 0.25 }}
              content={<ChartTooltip valueLabel="Requests" />}
            />
            <Area
              type="monotone"
              dataKey="count"
              name="requests"
              stroke={REQUESTS_COLOR}
              strokeWidth={2}
              fill="url(#requestsGradient)"
              activeDot={{ r: 4, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="mt-auto flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs">
          <span className="text-muted-foreground">Peak hour</span>
          <span className="font-semibold tabular-nums">
            {peak.time || "—"}
            <span className="ml-2 font-normal text-muted-foreground">
              {peak.count.toLocaleString()} requests
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
