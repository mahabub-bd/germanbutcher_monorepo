"use client";

import {
  AnalyticsCardHeader,
  AnalyticsRangeBadge,
} from "@/components/admin/analytics/analytics-card-header";
import { AnalyticsEmptyState } from "@/components/admin/analytics/analytics-empty-state";
import { ChartTooltip } from "@/components/admin/analytics/chart-tooltip";
import { Card, CardContent } from "@/components/ui/card";
import type { PeakTraffic, ResponseTimes } from "@/utils/types";
import { ArrowDown, ArrowUp, Clock } from "lucide-react";
import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface PeakTrafficResponseCardProps {
  traffic: PeakTraffic[];
  responseTimes: ResponseTimes;
  /** Aggregation window shown in the header, e.g. "7 days". */
  rangeLabel?: string;
}

const BAR_COLOR = "#8b5cf6"; // Violet-500
const PEAK_COLOR = "#800000"; // Brand maroon — highlights the busiest hour

function ResponseTimeTile({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone: "blue" | "green" | "red";
}) {
  const tones = {
    blue: "border-blue-200/70 bg-blue-50/70 text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-400",
    green:
      "border-green-200/70 bg-green-50/70 text-green-600 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-400",
    red: "border-red-200/70 bg-red-50/70 text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400",
  };

  return (
    <div className={`flex items-center gap-2 rounded-xl border p-2.5 ${tones[tone]}`}>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/70 dark:bg-white/10">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="truncate text-sm font-bold leading-tight">{value}</div>
        <div className="text-[11px] leading-tight text-muted-foreground">
          {label}
        </div>
      </div>
    </div>
  );
}

export function PeakTrafficResponseCard({
  traffic,
  responseTimes,
  rangeLabel = "7 days",
}: PeakTrafficResponseCardProps) {
  // Find peak from data
  const peakData =
    traffic.length > 0
      ? traffic.reduce((max, item) =>
          item.requestCount > max.requestCount ? item : max,
        )
      : null;

  // Map data to chart format
  const chartData = traffic.map((item) => ({
    hour: item.hour,
    requests: item.requestCount,
  }));

  // 24 hourly buckets need thinner ticks on a half-width card.
  const tickInterval = traffic.length > 12 ? 1 : 0;

  return (
    <Card className="h-full rounded-sm">
      <AnalyticsCardHeader
        title="Peak Traffic Hours"
        description={
          peakData
            ? `Peak at ${peakData.hour} with ${peakData.requestCount.toLocaleString()} requests`
            : "Hourly traffic distribution"
        }
        icon={Clock}
        tone="teal"
        action={<AnalyticsRangeBadge label={rangeLabel} />}
      />
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="grid grid-cols-3 gap-2">
          <ResponseTimeTile
            label="Average"
            value={`${responseTimes.avg}ms`}
            icon={<Clock className="size-3.5" />}
            tone="blue"
          />
          <ResponseTimeTile
            label="Minimum"
            value={`${responseTimes.min}ms`}
            icon={<ArrowDown className="size-3.5" />}
            tone="green"
          />
          <ResponseTimeTile
            label="Maximum"
            value={`${responseTimes.max}ms`}
            icon={<ArrowUp className="size-3.5" />}
            tone="red"
          />
        </div>

        {traffic.length === 0 ? (
          <AnalyticsEmptyState
            icon={Clock}
            title="No traffic data available"
            description="Hourly peaks will appear once requests are recorded"
          />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                opacity={0.2}
              />
              <XAxis
                dataKey="hour"
                axisLine={false}
                tickLine={false}
                tickMargin={10}
                interval={tickInterval}
                minTickGap={16}
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
                content={<ChartTooltip valueLabel="Requests" />}
              />
              <Bar dataKey="requests" radius={[4, 4, 0, 0]} maxBarSize={26}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.hour}
                    fill={
                      entry.requests === peakData?.requestCount
                        ? PEAK_COLOR
                        : BAR_COLOR
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
