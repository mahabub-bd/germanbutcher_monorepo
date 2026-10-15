"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";
import type { TopProductPage } from "@/utils/types";

interface TopProductPagesCardProps {
  data: TopProductPage[];
}

export function TopProductPagesCard({ data }: TopProductPagesCardProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  if (data.length === 0) {
    return (
      <Card className="h-full rounded-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Top Product Pages</CardTitle>
          <CardDescription>No data available yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="size-5 text-muted-foreground" />
            </span>
            <p className="text-sm font-medium">No product page data</p>
            <p className="mt-1 max-w-56 text-xs text-muted-foreground">
              Product page analytics will appear here once there is traffic
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full rounded-sm">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Top Product Pages</CardTitle>
        <CardDescription>Most viewed product detail pages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((page) => (
            <div key={page.path}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate font-medium">
                  {page.productName}
                </span>
                <span className="shrink-0 font-medium text-muted-foreground">
                  {page.count.toLocaleString()} views
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primaryColor"
                  style={{ width: `${Math.round((page.count / maxCount) * 100)}%` }}
                />
              </div>
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground">
            Based on product detail page requests since path tracking was
            enabled
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
