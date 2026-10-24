"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AnalyticsCardHeader } from "@/components/admin/analytics/analytics-card-header";
import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { VisitorsData } from "@/utils/types";

interface VisitorsChartProps {
  data: VisitorsData[];
}

const VISITORS_COLOR = "#10b981"; // Emerald-500

export function VisitorsChart({ data }: VisitorsChartProps) {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate total visitors
  const totalVisitors = data.reduce((sum, item) => sum + item.count, 0);

  // Map data to chart format
  const chartData = data.map((item) => ({
    date: item.date,
    visitors: item.count,
  }));

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
            <span className="text-gray-600 dark:text-gray-400">Visitors:</span>
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
      <Card className="h-full rounded-sm">
        <AnalyticsCardHeader
          title="Visitors Overview"
          description="No data available"
          icon={Users}
          tone="green"
        />
      </Card>
    );
  }

  return (
    <Card className="h-full rounded-sm">
      <AnalyticsCardHeader
        title="Visitors Overview"
        description={`${totalVisitors.toLocaleString()} total visitors`}
        icon={Users}
        tone="green"
      />
      <CardContent>
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tickMargin={5}
              // Force every tick on desktop; auto-thin overlapping labels on mobile
              interval={windowSize.width < 640 ? "preserveStartEnd" : 0}
              minTickGap={windowSize.width < 640 ? 30 : 0}
              angle={-45}
              textAnchor="end"
              height={45}
              tick={{ fontSize: 11, fill: "currentColor" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              tick={{ fontSize: 11, fill: "currentColor" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="visitors"
              fill={VISITORS_COLOR}
              radius={[4, 4, 0, 0]}
              barSize={
                data.length > 20 ? 6 : windowSize.width < 640 ? 8 : 16
              }
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
