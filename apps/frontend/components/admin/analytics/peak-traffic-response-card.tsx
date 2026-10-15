"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowDown, ArrowUp, Clock } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PeakTraffic, ResponseTimes } from "@/utils/types";

interface PeakTrafficResponseCardProps {
  traffic: PeakTraffic[];
  responseTimes: ResponseTimes;
}

const BAR_COLOR = "#8b5cf6"; // Violet-500

function ResponseTimeTile({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 rounded-lg p-2 ${className ?? ""}`}>
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
}: PeakTrafficResponseCardProps) {
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
    if (width < 640) return 4;
    if (width < 768) return 2;
    return 0;
  };

  // Find peak from data
  const peakData =
    traffic.length > 0
      ? traffic.reduce((max, item) =>
          item.requestCount > max.requestCount ? item : max
        )
      : null;

  // Map data to chart format
  const chartData = traffic.map((item) => ({
    hour: item.hour,
    requests: item.requestCount,
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

  return (
    <Card className="h-full rounded-sm">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Peak Traffic Hours</CardTitle>
        <CardDescription>
          {peakData
            ? `Peak: ${peakData.hour} (${peakData.requestCount.toLocaleString()} requests)`
            : "No data"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <ResponseTimeTile
            label="Average"
            value={`${responseTimes.avg}ms`}
            icon={<Clock className="size-3.5 text-blue-600 dark:text-blue-400" />}
            className="bg-blue-50 dark:bg-blue-950/20"
          />
          <ResponseTimeTile
            label="Minimum"
            value={`${responseTimes.min}ms`}
            icon={
              <ArrowDown className="size-3.5 text-green-600 dark:text-green-400" />
            }
            className="bg-green-50 dark:bg-green-950/20"
          />
          <ResponseTimeTile
            label="Maximum"
            value={`${responseTimes.max}ms`}
            icon={<ArrowUp className="size-3.5 text-red-600 dark:text-red-400" />}
            className="bg-red-50 dark:bg-red-950/20"
          />
        </div>

        {traffic.length === 0 ? (
          <CardDescription>No traffic data available</CardDescription>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
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
                dataKey="requests"
                fill={BAR_COLOR}
                radius={[4, 4, 0, 0]}
                barSize={windowSize.width < 640 ? 8 : 16}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
