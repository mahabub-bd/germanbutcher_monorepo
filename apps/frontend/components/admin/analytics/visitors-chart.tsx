"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  const getXAxisInterval = () => {
    const { width } = windowSize;
    if (width < 640) return 6;
    if (width < 768) return 4;
    if (width < 1024) return 2;
    return 0;
  };

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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Visitors Overview</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Visitors Overview</CardTitle>
        <CardDescription>
          {totalVisitors.toLocaleString()} total visitors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              interval={getXAxisInterval()}
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
              barSize={windowSize.width < 640 ? 8 : 16}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
