"use client";

import { PulseDot } from "@/components/admin/analytics/online-now-card";
import { useOnlineUsers } from "@/components/admin/analytics/use-online-users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsOverview } from "@/utils/types";
import { Activity, Clock, TrendingUp, Users, Zap } from "lucide-react";
import Link from "next/link";

interface AnalyticsWidgetProps {
  data: AnalyticsOverview;
}

function safeValue(value: number, fallback: string = "-"): string {
  return typeof value === "number" && !isNaN(value)
    ? value.toLocaleString()
    : fallback;
}

function safeFixed(
  value: number | undefined,
  decimals: number = 0,
  fallback: string = "-",
): string {
  return typeof value === "number" && !isNaN(value)
    ? value.toFixed(decimals)
    : fallback;
}

export function AnalyticsWidget({ data }: AnalyticsWidgetProps) {
  const { data: online } = useOnlineUsers();

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
      value: data.topEndpoint
        ? data.topEndpoint.split(" ").slice(0, 2).join(" ")
        : "-",
      icon: Activity,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
    },
  ];

  return (
    <Card className="w-full overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4 border-b bg-muted/20 px-5 py-4">
        <div className="space-y-0.5">
          <CardTitle className="text-base font-semibold tracking-tight">
            Analytics overview
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Live traffic and request performance
          </p>
        </div>
        <Link
          href="/admin/analytics"
          className="shrink-0 text-sm font-medium text-primary underline-offset-4 transition-colors hover:text-primary/75 hover:underline"
        >
          View Details
        </Link>
      </CardHeader>
      <CardContent className="p-3 sm:p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 lg:gap-3">
          <div className="flex min-w-0 flex-col rounded-xl border border-border/70 bg-card p-3 transition-colors hover:bg-muted/40 lg:min-h-32">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20">
              <PulseDot />
            </div>
            <span className="truncate text-xl font-semibold tracking-tight tabular-nums">
              {online ? online.total : "--"}
            </span>
            <span className="mt-0.5 text-xs font-medium text-muted-foreground">
              Online now
            </span>
            {online && (
              <span className="mt-auto pt-2 text-[10px] leading-tight text-muted-foreground">
                {online.authenticated} logged in · {online.guests} guests
              </span>
            )}
          </div>
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="flex min-w-0 flex-col rounded-xl border border-border/70 bg-card p-3 transition-colors hover:bg-muted/40 lg:min-h-32"
            >
              <div
                className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${stat.bgColor}`}
              >
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <span
                className="truncate text-xl font-semibold tracking-tight tabular-nums"
                title={stat.value}
              >
                {stat.value}
              </span>
              <span className="mt-0.5 text-xs font-medium text-muted-foreground">
                {stat.title}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
