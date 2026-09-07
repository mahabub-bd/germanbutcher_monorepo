"use client";

import { PulseDot } from "@/components/admin/analytics/online-now-card";
import { useOnlineUsers } from "@/components/admin/analytics/use-online-users";
import StatsCard from "@/components/admin/dashboard/stats-card";
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
      bgColor: "blue" as const,
    },
    {
      title: "Visitors",
      value: safeValue(data.uniqueVisitors, "-"),
      icon: Users,
      bgColor: "green" as const,
    },
    {
      title: "Avg Response",
      value: `${safeFixed(data.avgResponseTime, 0, "-")}ms`,
      icon: Clock,
      bgColor: "purple" as const,
    },
    {
      title: "Req/Min",
      value: safeFixed(data.requestsPerMinute, 1, "-"),
      icon: Zap,
      bgColor: "amber" as const,
    },
    {
      title: "Peak Hour",
      value: data.peakHour || "-",
      icon: TrendingUp,
      bgColor: "indigo" as const,
    },
    {
      title: "Top Endpoint",
      value: data.topEndpoint
        ? data.topEndpoint.split(" ").slice(0, 2).join(" ")
        : "-",
      icon: Activity,
      bgColor: "violet" as const,
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
          <StatsCard
            icon={Users}
            title="Online Now"
            value={online ? online.total : "--"}
            description={
              online
                ? `${online.authenticated} logged in · ${online.guests} guests`
                : undefined
            }
            badge={{ icon: PulseDot, text: "LIVE", color: "success" }}
            bgColor="green"
          />
          {stats.map((stat) => (
            <StatsCard
              key={stat.title}
              icon={stat.icon}
              title={stat.title}
              value={stat.value}
              bgColor={stat.bgColor}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
