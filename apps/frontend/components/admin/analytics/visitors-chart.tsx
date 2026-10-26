"use client";

import { AnalyticsCardHeader, AnalyticsRangeBadge } from "@/components/admin/analytics/analytics-card-header";
import { AnalyticsEmptyState } from "@/components/admin/analytics/analytics-empty-state";
import { ChartTooltip } from "@/components/admin/analytics/chart-tooltip";
import { Card, CardContent } from "@/components/ui/card";
import type { VisitorsData } from "@/utils/types";
import { Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface VisitorsChartProps {
  data: VisitorsData[];
  /** Aggregation window shown in the header, e.g. "30 days". */
  rangeLabel?: string;
}

const VISITORS_COLOR = "#10b981"; // Emerald-500

export function VisitorsChart({
  data,
  rangeLabel = "30 days",
}: VisitorsChartProps) {
  const totalVisitors = data.reduce((sum, item) => sum + item.count, 0);
  const bestDay = data.reduce(
    (max, item) => (item.count > max.count ? item : max),
    data[0] ?? { date: "", count: 0 },
  );

  // 30 daily buckets otherwise print every label and collide on half-width
  // cards — show roughly a dozen evenly-spaced ticks.
  const tickInterval = data.length > 12 ? Math.ceil(data.length / 12) - 1 : 0;

  const chartData = data.map((item) => ({
    date: item.date,
    visitors: item.count,
  }));

  if (!data || data.length === 0) {
    return (
      <Card className="h-full rounded-sm">
        <AnalyticsCardHeader
          title="Visitors Overview"
          description="Daily unique visitors"
          icon={Users}
          tone="green"
          action={<AnalyticsRangeBadge label={rangeLabel} />}
        />
        <CardContent>
          <AnalyticsEmptyState
            icon={Users}
            title="No visitor data yet"
            description="Daily visitor counts will appear once traffic is recorded"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full rounded-sm">
      <AnalyticsCardHeader
        title="Visitors Overview"
        description={`${totalVisitors.toLocaleString()} unique visitors`}
        icon={Users}
        tone="green"
        action={<AnalyticsRangeBadge label={rangeLabel} />}
      />
      <CardContent className="flex flex-1 flex-col gap-3">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 8, left: -12, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="visitorsGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.95} />
                <stop offset="100%" stopColor={VISITORS_COLOR} stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              opacity={0.2}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              interval={tickInterval}
              minTickGap={20}
              angle={-40}
              textAnchor="end"
              height={46}
              tick={{ fontSize: 11, fill: "currentColor" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              width={44}
              tick={{ fontSize: 11, fill: "currentColor" }}
            />
            <Tooltip
              cursor={{ fill: "currentColor", fillOpacity: 0.06 }}
              content={<ChartTooltip valueLabel="Visitors" />}
            />
            <Bar
              dataKey="visitors"
              fill="url(#visitorsGradient)"
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-auto flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs">
          <span className="text-muted-foreground">Best day</span>
          <span className="font-semibold tabular-nums">
            {bestDay.date || "—"}
            <span className="ml-2 font-normal text-muted-foreground">
              {bestDay.count.toLocaleString()} visitors
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
