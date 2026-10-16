"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AnalyticsCardHeader } from "@/components/admin/analytics/analytics-card-header";
import { Share2 } from "lucide-react";
import type { TrafficSource } from "@/utils/types";

interface TrafficSourcesCardProps {
  data: TrafficSource[];
}

export function TrafficSourcesCard({ data }: TrafficSourcesCardProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  if (data.length === 0) {
    return (
      <Card className="h-full rounded-sm">
        <AnalyticsCardHeader
          title="Traffic Sources"
          description="Where visitors come from (no referer = Direct)"
          icon={Share2}
          tone="teal"
        />
      </Card>
    );
  }

  return (
    <Card className="h-full rounded-sm">
      <AnalyticsCardHeader
        title="Traffic Sources"
        description="Where visitors come from (no referer = Direct)"
        icon={Share2}
        tone="teal"
      />
      <CardContent>
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.source}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate font-medium">
                  {item.source}
                </span>
                <span className="shrink-0 font-medium text-muted-foreground">
                  {item.count.toLocaleString()}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-indigo-500"
                  style={{
                    width: `${Math.round((item.count / maxCount) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
