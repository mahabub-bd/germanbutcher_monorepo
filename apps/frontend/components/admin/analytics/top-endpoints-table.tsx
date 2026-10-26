"use client";

import {
  AnalyticsCardHeader,
  AnalyticsRangeBadge,
} from "@/components/admin/analytics/analytics-card-header";
import { AnalyticsEmptyState } from "@/components/admin/analytics/analytics-empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TopEndpoint } from "@/utils/types";
import { Network } from "lucide-react";

interface TopEndpointsTableProps {
  data: TopEndpoint[];
  /** Aggregation window shown in the header, e.g. "24 hours". */
  rangeLabel?: string;
}

const getMethodColor = (method: string) => {
  switch (method.toUpperCase()) {
    case "GET":
      return "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400";
    case "POST":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400";
    case "PUT":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400";
    case "PATCH":
      return "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400";
    case "DELETE":
      return "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-950/40 dark:text-gray-400";
  }
};

/** Latency tone: green when fast, amber when noticeable, red when slow. */
const getLatencyClass = (ms: number) => {
  if (ms < 300) return "text-green-600 dark:text-green-400";
  if (ms < 800) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
};

export function TopEndpointsTable({
  data,
  rangeLabel = "selected period",
}: TopEndpointsTableProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const totalRequests = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="h-full rounded-sm">
      <AnalyticsCardHeader
        title="Top Endpoints"
        description="Most frequently accessed API endpoints"
        icon={Network}
        tone="indigo"
        action={<AnalyticsRangeBadge label={rangeLabel} />}
      />
      <CardContent className="flex flex-1 flex-col gap-3">
        {data.length === 0 ? (
          <AnalyticsEmptyState
            icon={Network}
            title="No endpoint data yet"
            description="API traffic will appear here once requests are recorded"
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="min-w-0 sm:min-w-[560px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead className="hidden sm:table-cell">Method</TableHead>
                    <TableHead className="hidden w-36 md:table-cell">
                      Traffic share
                    </TableHead>
                    <TableHead className="text-right">Requests</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">
                      Avg time
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((endpoint, index) => (
                    <TableRow key={`${endpoint.endpoint}-${index}`}>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {index + 1}
                      </TableCell>
                      <TableCell
                        className="max-w-52 font-mono text-sm"
                        title={endpoint.endpoint}
                      >
                        <span className="block truncate">
                          {endpoint.endpoint}
                        </span>
                        {/* The method/time columns are hidden on phones, so
                            keep the context inline instead of scrolling. */}
                        <span className="mt-1 flex items-center gap-1.5 font-sans sm:hidden">
                          <Badge className={getMethodColor(endpoint.method)}>
                            {endpoint.method}
                          </Badge>
                          <span
                            className={`text-[11px] tabular-nums ${getLatencyClass(endpoint.avgResponseTime)}`}
                          >
                            {endpoint.avgResponseTime.toFixed(0)}ms avg
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge className={getMethodColor(endpoint.method)}>
                          {endpoint.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="h-1.5 rounded-full bg-muted">
                          <div
                            className="h-1.5 rounded-full bg-primaryColor"
                            style={{
                              width: `${Math.round(
                                (endpoint.count / maxCount) * 100,
                              )}%`,
                            }}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {endpoint.count.toLocaleString()}
                      </TableCell>
                      <TableCell
                        className={`hidden text-right tabular-nums sm:table-cell ${getLatencyClass(endpoint.avgResponseTime)}`}
                        title={`${endpoint.avgResponseTime.toFixed(0)}ms average response time`}
                      >
                        {endpoint.avgResponseTime.toFixed(0)}ms
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-auto flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs">
              <span className="text-muted-foreground">
                Top {data.length} endpoints
              </span>
              <span className="font-semibold tabular-nums">
                {totalRequests.toLocaleString()} requests
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
