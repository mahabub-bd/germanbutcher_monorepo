"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AnalyticsRequests } from "@/utils/types";
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
}

const REQUESTS_COLOR = "#6366f1"; // Indigo-500

export function RequestsChart({ data }: RequestsChartProps) {
  const totalRequests = data.reduce((sum, item) => sum + item.count, 0);
  const avgRequests = data.length > 0 ? Math.round(totalRequests / data.length) : 0;

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: unknown[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const entry = payload[0] as { value?: number };
      return (
        <div className="rounded-lg border bg-white dark:bg-gray-800 p-3 shadow-lg">
          <div className="font-semibold mb-1 text-sm">{label}</div>
          <div className="flex items-center justify-between text-sm gap-4">
            <span className="text-gray-600 dark:text-gray-400">Requests:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {(entry.value ?? 0).toLocaleString()}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Request Traffic</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Request Traffic</CardTitle>
        <CardDescription>
          {totalRequests.toLocaleString()} total requests (avg: {avgRequests.toLocaleString()}/period)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="requestsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={REQUESTS_COLOR} stopOpacity={0.3} />
                <stop offset="95%" stopColor={REQUESTS_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              tick={{ fontSize: 11, fill: "currentColor" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              tick={{ fontSize: 11, fill: "currentColor" }}
              tickFormatter={(value) =>
                value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              name="requests"
              stroke={REQUESTS_COLOR}
              strokeWidth={2}
              fill="url(#requestsGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
