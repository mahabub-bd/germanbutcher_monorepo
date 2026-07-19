"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsOverview } from "@/utils/types";
import {
  Activity,
  Clock,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";

interface AnalyticsWidgetProps {
  data: AnalyticsOverview;
}

function safeValue(value: number, fallback: string = "-"): string {
  return typeof value === "number" && !isNaN(value) ? value.toLocaleString() : fallback;
}

function safeFixed(value: number | undefined, decimals: number = 0, fallback: string = "-"): string {
  return typeof value === "number" && !isNaN(value) ? value.toFixed(decimals) : fallback;
}

export function AnalyticsWidget({ data }: AnalyticsWidgetProps) {
  // Handle missing or incomplete data gracefully
  if (!data || typeof data !== "object") {
    console.warn("AnalyticsWidget: Invalid data received", data);
    return null;
  }

  // Validate required fields exist
  if (
    typeof data.totalRequests !== "number" ||
    typeof data.uniqueVisitors !== "number" ||
    typeof data.avgResponseTime !== "number" ||
    typeof data.requestsPerMinute !== "number"
  ) {
    console.warn("AnalyticsWidget: Missing required numeric fields", data);
    return null;
  }

  const stats = [
    {
      title: "Total Requests",
      value: safeValue(data.totalRequests, "-"),
      icon: Activity,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Visitors",
      value: safeValue(data.uniqueVisitors, "-"),
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "Avg Response",
      value: `${safeFixed(data.avgResponseTime, 0, "-")}ms`,
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      title: "Req/Min",
      value: safeFixed(data.requestsPerMinute, 1, "-"),
      icon: Zap,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
      title: "Peak Hour",
      value: data.peakHour || "-",
      icon: TrendingUp,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
    },
    {
      title: "Top Endpoint",
      value: data.topEndpoint ? data.topEndpoint.split(" ").slice(0, 2).join(" ") : "-",
      icon: Activity,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
    },
  ];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold">Analytics</CardTitle>
        <Link
          href="/admin/analytics"
          className="text-sm text-blue-600 hover:underline"
        >
          View Details
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="flex flex-col items-center p-3 rounded-lg border"
            >
              <div className={`p-2 rounded-lg ${stat.bgColor} mb-2`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <span className="text-lg font-bold">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.title}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
