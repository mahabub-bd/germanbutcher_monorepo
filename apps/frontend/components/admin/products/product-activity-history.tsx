"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchDataPagination } from "@/utils/api-utils";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  History,
  Pencil,
  Power,
  RefreshCw,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface ProductHistoryEntry {
  id: number;
  productId: number | null;
  productName: string;
  action: "created" | "updated" | "activated" | "deactivated" | "deleted";
  changes: Record<string, { from: unknown; to: unknown }> | null;
  snapshot: Record<string, unknown> | null;
  userId: number | null;
  userName: string | null;
  createdAt: string;
}

type EventKind = ProductHistoryEntry["action"];

const KIND_META: Record<
  EventKind,
  {
    label: string;
    badgeClass: string;
    dotClass: string;
    icon: React.ReactNode;
  }
> = {
  created: {
    label: "Added",
    badgeClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    dotClass: "bg-emerald-100 dark:bg-emerald-500/20",
    icon: <CirclePlus className="size-3.5 text-emerald-600 dark:text-emerald-400" />,
  },
  updated: {
    label: "Edited",
    badgeClass:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
    dotClass: "bg-blue-100 dark:bg-blue-500/20",
    icon: <Pencil className="size-3.5 text-blue-600 dark:text-blue-400" />,
  },
  activated: {
    label: "Activated",
    badgeClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    dotClass: "bg-emerald-100 dark:bg-emerald-500/20",
    icon: <Power className="size-3.5 text-emerald-600 dark:text-emerald-400" />,
  },
  deactivated: {
    label: "Deactivated",
    badgeClass:
      "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
    dotClass: "bg-red-100 dark:bg-red-500/20",
    icon: <Power className="size-3.5 text-red-600 dark:text-red-400" />,
  },
  deleted: {
    label: "Deleted",
    badgeClass:
      "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
    dotClass: "bg-red-100 dark:bg-red-500/20",
    icon: <Trash2 className="size-3.5 text-red-600 dark:text-red-400" />,
  },
};

const ACTION_FILTERS: { value: EventKind; label: string }[] = [
  { value: "created", label: "Added" },
  { value: "updated", label: "Edited" },
  { value: "activated", label: "Activated" },
  { value: "deactivated", label: "Deactivated" },
  { value: "deleted", label: "Deleted" },
];

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function formatStatusValue(key: string, value: unknown): string {
  if (key === "isActive") return value ? "Active" : "Inactive";
  return formatValue(value);
}

/** Time-only label (with the same timezone as the shared
 * formatDateTime helper) for the date-grouped feed. */
function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Dhaka",
  });
}

/** YYYY-MM-DD key for grouping, resolved in the shared timezone. */
function dayKey(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-CA", {
    timeZone: "Asia/Dhaka",
  });
}

function dayLabel(key: string): string {
  const today = dayKey(new Date().toISOString());
  const yesterday = new Date(
    new Date(`${today}T00:00:00Z`).getTime() - 24 * 60 * 60 * 1000,
  )
    .toISOString()
    .slice(0, 10);

  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";
  return new Date(`${key}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Group entries (already sorted newest first) into day buckets while
 * keeping their original order inside each bucket. */
function groupEntriesByDay(
  entries: ProductHistoryEntry[],
): { key: string; label: string; entries: ProductHistoryEntry[] }[] {
  const groups: { key: string; label: string; entries: ProductHistoryEntry[] }[] =
    [];
  const byKey = new Map<string, (typeof groups)[number]>();

  for (const entry of entries) {
    const key = dayKey(entry.createdAt);
    let group = byKey.get(key);
    if (!group) {
      group = { key, label: dayLabel(key), entries: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    group.entries.push(entry);
  }
  return groups;
}

function DayGroup({
  label,
  entries,
  showProduct,
}: {
  label: string;
  entries: ProductHistoryEntry[];
  showProduct: boolean;
}) {
  return (
    <div>
      <h3 className="sticky top-0 z-10 bg-background/95 border-b py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
        {label}
      </h3>
      <ul className="mt-4">
        {entries.map((entry) => (
          <ActivityEntry key={entry.id} entry={entry} showProduct={showProduct} />
        ))}
      </ul>
      <div className="h-8" />
    </div>
  );
}

function ActivityEntry({
  entry,
  showProduct,
}: {
  entry: ProductHistoryEntry;
  showProduct: boolean;
}) {
  const meta = KIND_META[entry.action];
  const changes = Object.entries(entry.changes ?? {});

  return (
    <li className="relative pl-10 pb-6 last:pb-0">
      {/* Timeline line + dot */}
      <span className="absolute left-3.75 top-6 bottom-0 w-px bg-border last:hidden" />
      <span
        className={`absolute left-2 top-1 flex size-7 items-center justify-center rounded-full border ring-2 ring-background ${meta.dotClass}`}
      >
        {meta.icon}
      </span>

      {/* Single-line layout on desktop; stacks vertically on mobile */}
      <div className="flex flex-col items-start gap-1.5 md:flex-row md:flex-wrap md:items-center md:gap-2">
        <Badge className={`gap-1 border-0 ${meta.badgeClass}`}>
          {meta.icon}
          {meta.label}
        </Badge>
        {showProduct &&
          (entry.productId ? (
            <Link
              href={`/admin/products/${entry.productId}/view`}
              className="max-w-55 truncate text-sm font-medium hover:underline"
            >
              {entry.productName}
            </Link>
          ) : (
            <span className="max-w-55 truncate text-sm font-medium">
              {entry.productName}
            </span>
          ))}

        {changes.map(([key, change]) => (
          <span
            key={key}
            className="inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-0.5 text-xs whitespace-nowrap"
          >
            <span className="text-muted-foreground">{key}</span>
            <span className="text-red-600 dark:text-red-400 line-through">
              {formatStatusValue(key, change.from)}
            </span>
            <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {formatStatusValue(key, change.to)}
            </span>
          </span>
        ))}

        <span className="text-sm text-muted-foreground whitespace-nowrap md:ml-auto">
          {formatTime(entry.createdAt)}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
          <User className="size-3 shrink-0" />
          {entry.userName || "Unknown User"}
        </span>
      </div>
    </li>
  );
}

function HistorySkeleton() {
  return (
    <div className="space-y-8 py-1" aria-busy="true" aria-live="polite">
      {/* Day header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-px flex-1" />
      </div>
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="relative flex items-start gap-3">
          <Skeleton className="absolute left-0 top-1 size-7 rounded-full" />
          <div className="flex-1 space-y-2 pl-10">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-40 rounded-full" />
              <Skeleton className="ml-auto h-4 w-20" />
            </div>
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface ProductActivityHistoryProps {
  /** When set, shows history of this one product only; otherwise all products. */
  productId?: number;
}

export default function ProductActivityHistory({
  productId,
}: ProductActivityHistoryProps) {
  const [entries, setEntries] = useState<ProductHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const PAGE_SIZE = 15;

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      if (productId) {
        const response = await fetchDataPagination<{
          data: ProductHistoryEntry[];
        }>(`products/${productId}/history`);
        setEntries(response.data ?? []);
      } else {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: PAGE_SIZE.toString(),
        });
        if (actionFilter !== "all") params.set("action", actionFilter);
        const response = await fetchDataPagination<{
          data: ProductHistoryEntry[];
          total: number;
          totalPages: number;
        }>(`products/history?${params.toString()}`);
        setEntries(response.data ?? []);
        setTotalItems(response.total ?? 0);
        setTotalPages(response.totalPages ?? 1);
      }
    } catch (error) {
      console.error("Error fetching product history:", error);
      toast.error("Failed to load product history.");
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [productId, currentPage, actionFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const groupedEntries = useMemo(() => groupEntriesByDay(entries), [entries]);
  const hasActiveFilter = actionFilter !== "all";

  return (
    <div className="space-y-4">
      {!productId && (
        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">
            {hasActiveFilter ? "Showing" : "Total of"}{" "}
            <span className="font-medium text-foreground">
              {totalItems}
            </span>{" "}
            history {totalItems === 1 ? "event" : "events"}
            {hasActiveFilter ? " matching the selected action" : ""}
          </p>
          <div className="flex items-center gap-2">
            <Select
              value={actionFilter}
              onValueChange={(value) => {
                setCurrentPage(1);
                setActionFilter(value);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {ACTION_FILTERS.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHistory}
              disabled={isLoading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <HistorySkeleton />
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center">
          <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted">
            <History className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">
            {hasActiveFilter ? "No matching events found." : "No history yet."}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {hasActiveFilter
              ? "Try a different action filter or the refresh button."
              : "Product changes (added, edited, activated, deleted) will show up here."}
          </p>
        </div>
      ) : (
        <div className="mt-2">
          {groupedEntries.map((group) => (
            <DayGroup
              key={group.key}
              label={group.label}
              entries={group.entries}
              showProduct={!productId}
            />
          ))}
        </div>
      )}

      {!productId && totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Page{" "}
            <span className="font-medium text-foreground">
              {currentPage}
            </span>{" "}
            of <span className="font-medium text-foreground">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((page) => page - 1)}
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((page) => page + 1)}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
