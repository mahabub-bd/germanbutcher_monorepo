"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import type { TicketStatistics } from "@/components/admin/inbox/ticket-shared";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  XCircle,
} from "lucide-react";

export function TicketStatsCards({
  statistics,
  isLoading,
}: {
  statistics: TicketStatistics;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800 animate-pulse"
          >
            <div className="h-4 bg-gray-200 dark:bg-neutral-800 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-neutral-800 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Total Messages",
      value: statistics.total,
      icon: MessageSquare,
      bgColor: "blue" as const,
    },
    {
      title: "Pending",
      value: statistics.byStatus.pending,
      icon: Clock,
      bgColor: "amber" as const,
    },
    {
      title: "In Progress",
      value: statistics.byStatus.in_progress,
      icon: AlertCircle,
      bgColor: "indigo" as const,
    },
    {
      title: "Resolved",
      value: statistics.byStatus.resolved,
      icon: CheckCircle,
      bgColor: "green" as const,
    },
    {
      title: "Closed",
      value: statistics.byStatus.closed,
      icon: XCircle,
      bgColor: "red" as const,
    },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
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
  );
}
