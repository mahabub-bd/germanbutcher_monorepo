"use client";

import { AnalyticsCardHeader, AnalyticsRangeBadge } from "@/components/admin/analytics/analytics-card-header";
import { AnalyticsEmptyState } from "@/components/admin/analytics/analytics-empty-state";
import { Card, CardContent } from "@/components/ui/card";
import type { TrafficSource } from "@/utils/types";
import {
  Globe2,
  MousePointerClick,
  Search,
  Server,
  Share2,
  type LucideIcon,
} from "lucide-react";

interface TrafficSourcesCardProps {
  data: TrafficSource[];
  /** Aggregation window shown in the header, e.g. "30 days". */
  rangeLabel?: string;
}

const SOURCE_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
  "#8b5cf6",
];

/** Best-effort glyph for the referrer host reported by analytics. */
function sourceIcon(source: string): LucideIcon {
  const value = source.toLowerCase();
  if (value === "direct" || value.includes("none")) return MousePointerClick;
  if (value.includes("google") || value.includes("bing") || value.includes("search")) {
    return Search;
  }
  if (value.includes("localhost") || value.includes("127.0.0.1")) {
    return Server;
  }
  if (
    value.includes("facebook") ||
    value.includes("instagram") ||
    value.includes("twitter") ||
    value.includes("linkedin")
  ) {
    return Share2;
  }
  return Globe2;
}

export function TrafficSourcesCard({
  data,
  rangeLabel = "30 days",
}: TrafficSourcesCardProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const topSource = data.reduce<TrafficSource | null>(
    (max, item) => (!max || item.count > max.count ? item : max),
    null,
  );
  const topShare =
    topSource && total > 0
      ? Math.round((topSource.count / total) * 100)
      : 0;

  if (data.length === 0) {
    return (
      <Card className="h-full rounded-sm">
        <AnalyticsCardHeader
          title="Traffic Sources"
          description="Where visitors come from (no referer = Direct)"
          icon={Share2}
          tone="teal"
          action={<AnalyticsRangeBadge label={rangeLabel} />}
        />
        <CardContent>
          <AnalyticsEmptyState
            icon={Share2}
            title="No traffic sources yet"
            description="Referrer data will appear once visitors start arriving"
          />
        </CardContent>
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
        action={<AnalyticsRangeBadge label={rangeLabel} />}
      />
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="space-y-3">
          {data.map((item, index) => {
            const Icon = sourceIcon(item.source);
            const color = SOURCE_COLORS[index % SOURCE_COLORS.length];
            const pct =
              total > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <div key={item.source}>
                <div className="mb-1 flex items-center gap-2 text-xs">
                  <span
                    className="flex size-6 shrink-0 items-center justify-center rounded-md"
                    style={{
                      backgroundColor: `${color}1a`,
                      color,
                    }}
                  >
                    <Icon className="size-3" />
                  </span>
                  <span
                    className="min-w-0 flex-1 truncate font-medium"
                    title={item.source}
                  >
                    {item.source}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {item.count.toLocaleString()}
                  </span>
                  <span className="w-9 text-right tabular-nums text-muted-foreground">
                    {pct}%
                  </span>
                </div>
                <div className="ml-8 h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full transition-[width] duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs">
          <span className="text-muted-foreground">
            {topSource ? `${topSource.source} · ${topShare}%` : "Total visits"}
          </span>
          <span className="font-semibold tabular-nums">
            {total.toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
