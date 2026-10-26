"use client";

import { AnalyticsCardHeader, AnalyticsRangeBadge } from "@/components/admin/analytics/analytics-card-header";
import { AnalyticsEmptyState } from "@/components/admin/analytics/analytics-empty-state";
import { Card, CardContent } from "@/components/ui/card";
import type { TopProductPage } from "@/utils/types";
import { ShoppingBag } from "lucide-react";

interface TopProductPagesCardProps {
  data: TopProductPage[];
  /** Aggregation window shown in the header, e.g. "7 days". */
  rangeLabel?: string;
}

export function TopProductPagesCard({
  data,
  rangeLabel = "7 days",
}: TopProductPagesCardProps) {
  const totalViews = data.reduce((sum, item) => sum + item.count, 0);
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  if (data.length === 0) {
    return (
      <Card className="h-full rounded-sm">
        <AnalyticsCardHeader
          title="Top Product Pages"
          description="Most viewed product detail pages"
          icon={ShoppingBag}
          tone="amber"
          action={<AnalyticsRangeBadge label={rangeLabel} />}
        />
        <CardContent>
          <AnalyticsEmptyState
            icon={ShoppingBag}
            title="No product page data"
            description="Product page analytics will appear here once there is traffic"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full rounded-sm">
      <AnalyticsCardHeader
        title="Top Product Pages"
        description="Most viewed product detail pages"
        icon={ShoppingBag}
        tone="amber"
        action={<AnalyticsRangeBadge label={rangeLabel} />}
      />
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="space-y-3">
          {data.map((page, index) => {
            const pct = Math.round((page.count / maxCount) * 100);
            const share =
              totalViews > 0
                ? Math.round((page.count / totalViews) * 100)
                : 0;
            return (
              <div key={page.path}>
                <div className="mb-1 flex items-center gap-2 text-xs">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-semibold tabular-nums text-muted-foreground">
                    {index + 1}
                  </span>
                  <span
                    className="min-w-0 flex-1 truncate font-medium"
                    title={page.productName}
                  >
                    {page.productName}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {page.count.toLocaleString()} views
                  </span>
                  <span className="w-9 shrink-0 text-right tabular-nums text-muted-foreground">
                    {share}%
                  </span>
                </div>
                <div className="ml-7 h-1.5 rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-primaryColor transition-[width] duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
          <span>Based on product page views</span>
          <span className="shrink-0 font-semibold tabular-nums text-foreground">
            {totalViews.toLocaleString()} total
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
