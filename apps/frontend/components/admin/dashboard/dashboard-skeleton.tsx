import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * Dashboard skeletons.
 *
 * Every placeholder mirrors the real section it replaces — same card chrome,
 * grid tracks and row rhythm — so the page doesn't jump when data streams in.
 * Shared here so the route-level `loading.tsx` and the in-page `Suspense`
 * boundaries always paint the same picture.
 */

/** Card surface shared by every dashboard panel. */
function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-card shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** One stat card: label, big value, supporting line. */
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex min-h-25 w-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card p-3 sm:p-4",
        className,
      )}
    >
      {/* Watermark icon ghost */}
      <div className="absolute -top-2 -right-2 size-16 rounded-2xl bg-muted/50" />

      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-2.5 h-5 w-24" />
      <Skeleton className="mt-3 h-2.5 w-32 max-w-full" />
    </div>
  );
}

/** KPI grid — matches DashboardStatsGrid's 2 / 4 / 6 column tracks. */
export function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 2xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** A donut/pie panel with its title, ring and legend placeholders. */
export function PiePanelSkeleton({ className }: { className?: string }) {
  return (
    <Panel className={cn("flex h-full flex-col p-4", className)}>
      <div className="flex items-start gap-2">
        <Skeleton className="size-7 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-32 max-w-full" />
          <Skeleton className="h-2.5 w-40 max-w-full" />
        </div>
      </div>

      <div className="flex h-31 items-center justify-center xl:h-26 2xl:h-31">
        <div className="size-24 animate-pulse rounded-full border-[14px] border-muted" />
      </div>

      <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex min-w-0 items-center gap-1.5">
            <Skeleton className="size-2.5 shrink-0 rounded-full" />
            <Skeleton className="h-2.5 flex-1" />
            <Skeleton className="h-2.5 w-6 shrink-0" />
          </div>
        ))}
      </div>
    </Panel>
  );
}

/** The four distribution panels under the KPI grid. */
export function PieGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <PiePanelSkeleton key={i} />
      ))}
    </div>
  );
}

/** One compact, full-width order-status card. */
export function StatusCardSkeleton() {
  return (
    <div className="flex w-full items-center gap-2 rounded-lg border border-border/70 bg-card px-2.5 py-3 sm:py-2.5">
      <Skeleton className="size-7 shrink-0 rounded-md" />
      <Skeleton className="h-3 flex-1" />
      <Skeleton className="h-4 w-8 shrink-0" />
    </div>
  );
}

export function StatusGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4 2xl:grid-cols-7 2xl:gap-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <StatusCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Deterministic bar heights — looks like a chart without pretending to be data.
const BAR_HEIGHTS = [48, 74, 58, 86, 66, 94, 60, 80, 54, 90, 70, 98];

/** Chart card: header + tab pills + a bar-chart silhouette. */
export function ChartCardSkeleton({
  className,
  chartClassName = "h-70 sm:h-80 lg:h-75 2xl:h-100",
}: {
  className?: string;
  chartClassName?: string;
}) {
  return (
    <Panel className={cn("w-full overflow-hidden", className)}>
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-5 w-48 max-w-full" />
          <Skeleton className="h-3 w-64 max-w-full" />
        </div>
        <Skeleton className="h-9 w-full rounded-lg sm:w-52" />
      </div>

      <div className="p-4 pt-0">
        <div className={cn("flex items-end gap-1.5 sm:gap-2.5", chartClassName)}>
          {BAR_HEIGHTS.map((height, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-t-md"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </Panel>
  );
}

/**
 * Cell shapes used by the list skeletons. Keeping them semantic (lines,
 * badge, avatar…) lets each table echo its real column layout.
 */
export type SkeletonCellKind =
  | "text"
  | "lines"
  | "badge"
  | "avatar"
  | "center"
  | "right"
  | "action";

const TEXT_WIDTHS = ["w-24", "w-20", "w-16", "w-28", "w-14", "w-24"];

function SkeletonCell({
  kind,
  row,
}: {
  kind: SkeletonCellKind;
  row: number;
}) {
  switch (kind) {
    case "lines":
      return (
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-28 max-w-full" />
          <Skeleton className="h-2.5 w-20 max-w-full" />
        </div>
      );
    case "badge":
      return <Skeleton className="h-6 w-16 rounded-full" />;
    case "avatar":
      return <Skeleton className="size-10 rounded-md" />;
    case "center":
      return <Skeleton className="mx-auto h-3.5 w-10" />;
    case "right":
      return <Skeleton className="ml-auto h-3.5 w-16" />;
    case "action":
      return <Skeleton className="ml-auto size-8 rounded-md" />;
    default:
      return (
        <Skeleton
          className={cn("h-3.5", TEXT_WIDTHS[row % TEXT_WIDTHS.length])}
        />
      );
  }
}

/** Skeleton rows for tables whose real header is already on screen. */
export function TableRowsSkeleton({
  rows = 5,
  cells,
}: {
  rows?: number;
  cells: SkeletonCellKind[];
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, row) => (
        <TableRow key={row}>
          {cells.map((kind, col) => (
            <TableCell key={col}>
              <SkeletonCell kind={kind} row={row} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

/** Header row used by standalone (whole-table) list skeletons. */
function TableHeadSkeleton({
  columns,
}: {
  columns: SkeletonCellKind[];
}) {
  return (
    <TableHeader className="[&_tr]:bg-muted/40">
      <TableRow>
        {columns.map((kind, i) => (
          <TableHead key={i}>
            <Skeleton
              className={cn(
                "h-2.5",
                kind === "center" || kind === "right" || kind === "action"
                  ? "ml-auto w-12"
                  : "w-14",
              )}
            />
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

/** Generic card + table placeholder used by the dashboard's ranked lists. */
function RankedTableSkeleton({
  columns,
  rows = 5,
  minWidth = "min-w-190",
}: {
  columns: SkeletonCellKind[];
  rows?: number;
  minWidth?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <Table className={minWidth}>
        <TableHeadSkeleton columns={columns} />
        <TableBody>
          <TableRowsSkeleton rows={rows} cells={columns} />
        </TableBody>
      </Table>
    </div>
  );
}

/** The KPI cards + distribution panels at the top of the dashboard. */
export function DashboardStatsSkeleton() {
  return (
    <div className="space-y-3">
      <StatsGridSkeleton />
      <PieGridSkeleton />
    </div>
  );
}

/**
 * Everything the reports Suspense boundary awaits: KPI grid, order-status
 * strip, the two charts, and the monthly overview.
 */
export function DashboardReportsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <DashboardStatsSkeleton />
      <StatusGridSkeleton />
      <ChartCardSkeleton />
      <ChartCardSkeleton chartClassName="h-70 sm:h-80 lg:h-60 2xl:h-75" />
    </div>
  );
}

/** Analytics overview card — six compact stat cards under a header. */
export function AnalyticsSkeleton() {
  return (
    <Panel className="overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b bg-muted/20 px-5 py-4">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-52 max-w-full" />
        </div>
        <Skeleton className="h-4 w-20 shrink-0" />
      </div>
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 2xl:grid-cols-6 sm:p-4 lg:gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <StatCardSkeleton key={i} className="min-h-20" />
        ))}
      </div>
    </Panel>
  );
}

/** Orders section: page header, filter toolbar and the order table. */
export function OrdersTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="w-full space-y-2">
      <div className="mb-2 space-y-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="hidden h-3.5 w-72 max-w-full sm:block" />
      </div>

      {/* Filter toolbar */}
      <div className="rounded-xl border bg-card p-3 shadow-xs">
        <div className="flex flex-nowrap items-center gap-2 lg:gap-3">
          <Skeleton className="h-9 min-w-0 flex-1 rounded-lg md:w-40 md:flex-none lg:w-48 xl:w-56 2xl:w-64" />
          <Skeleton className="h-9 w-24 shrink-0 rounded-lg md:hidden" />
          <div className="hidden min-w-0 flex-1 items-center gap-1.5 md:flex lg:gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-9 min-w-16 flex-1 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-220 text-xs lg:min-w-0 2xl:text-sm">
            <TableHeadSkeleton
              columns={[
                "lines",
                "lines",
                "badge",
                "badge",
                "badge",
                "badge",
                "badge",
                "center",
                "right",
                "action",
              ]}
            />
            <TableBody>
              <TableRowsSkeleton
                rows={rows}
                cells={[
                  "lines",
                  "lines",
                  "badge",
                  "badge",
                  "badge",
                  "badge",
                  "badge",
                  "center",
                  "right",
                  "action",
                ]}
              />
            </TableBody>
          </Table>
        </div>

        {/* Pagination footer */}
        <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 md:flex-row">
          <Skeleton className="h-4 w-36 md:w-48" />
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="size-8 md:size-9" />
            ))}
          </div>
        </div>
      </Panel>
    </div>
  );
}

/** Stock reports card with its tabs, filters and table. */
export function StockReportsSkeleton() {
  return (
    <Panel className="w-full overflow-hidden">
      <div className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-48 max-w-full" />
        </div>
        <Skeleton className="h-9 w-48 shrink-0 rounded-lg" />
      </div>

      <div className="p-4 pt-0">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row">
          <Skeleton className="h-9 w-full rounded-lg sm:max-w-xs" />
          <Skeleton className="h-9 w-35 rounded-lg" />
        </div>

        <RankedTableSkeleton
          columns={[
            "avatar",
            "text",
            "badge",
            "badge",
            "center",
            "badge",
            "right",
            "right",
          ]}
          minWidth="min-w-205"
        />
      </div>
    </Panel>
  );
}

/** Top customers card: header controls + ranked table. */
export function TopCustomersSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Panel className="w-full overflow-hidden">
      <div className="flex flex-col gap-4 border-b bg-muted/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-56 max-w-full" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-27.5 rounded-lg sm:w-30" />
          <Skeleton className="h-9 w-30 rounded-lg" />
          <Skeleton className="h-9 w-32.5 rounded-lg sm:w-35" />
        </div>
      </div>

      <div className="p-3 sm:p-5">
        <RankedTableSkeleton
          columns={["badge", "text", "text", "text", "center", "right", "right"]}
          rows={rows}
        />
      </div>
    </Panel>
  );
}

/** Top selling products card: header controls + ranked product table. */
export function TopProductsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Panel className="w-full overflow-hidden">
      <div className="flex flex-col gap-4 border-b bg-muted/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56 max-w-full" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-27.5 rounded-lg sm:w-30" />
          <Skeleton className="h-9 w-32.5 rounded-lg sm:w-35" />
        </div>
      </div>

      <div className="p-3 sm:p-5">
        <RankedTableSkeleton
          columns={["badge", "avatar", "text", "center", "badge", "right", "right"]}
          rows={rows}
        />
      </div>
    </Panel>
  );
}

/**
 * Full route skeleton — the shape the dashboard settles into after every
 * section has hydrated.
 */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <DashboardReportsSkeleton />
      <AnalyticsSkeleton />
      <OrdersTableSkeleton />
      <StockReportsSkeleton />
      <TopCustomersSkeleton />
      <TopProductsSkeleton />
    </div>
  );
}
