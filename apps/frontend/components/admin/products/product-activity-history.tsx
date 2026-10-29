"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaginationComponent } from "@/components/common/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { fetchDataPagination } from "@/utils/api-utils";
import {
  Calendar,
  CirclePlus,
  History,
  Loader2,
  Pencil,
  Power,
  RefreshCw,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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
  { label: string; iconClass: string; badgeClass: string; icon: React.ReactNode }
> = {
  created: {
    label: "Added",
    iconClass:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    badgeClass:
      "bg-emerald-100 text-emerald-700 border-0 dark:bg-emerald-500/15 dark:text-emerald-400",
    icon: <CirclePlus className="h-4 w-4" />,
  },
  updated: {
    label: "Edited",
    iconClass: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
    badgeClass:
      "bg-blue-100 text-blue-700 border-0 dark:bg-blue-500/15 dark:text-blue-400",
    icon: <Pencil className="h-4 w-4" />,
  },
  activated: {
    label: "Activated",
    iconClass:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    badgeClass:
      "bg-emerald-100 text-emerald-700 border-0 dark:bg-emerald-500/15 dark:text-emerald-400",
    icon: <Power className="h-4 w-4" />,
  },
  deactivated: {
    label: "Deactivated",
    iconClass: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    badgeClass: "bg-red-100 text-red-700 border-0 dark:bg-red-500/15 dark:text-red-400",
    icon: <Power className="h-4 w-4" />,
  },
  deleted: {
    label: "Deleted",
    iconClass: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    badgeClass: "bg-red-100 text-red-700 border-0 dark:bg-red-500/15 dark:text-red-400",
    icon: <Trash2 className="h-4 w-4" />,
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

function HistoryRow({
  entry,
  index,
  showProduct,
}: {
  entry: ProductHistoryEntry;
  index: number;
  showProduct: boolean;
}) {
  const meta = KIND_META[entry.action];
  const changes = Object.entries(entry.changes ?? {});

  return (
    <TableRow className="border-b">
      <TableCell className="py-3 pl-4 text-sm text-muted-foreground sm:pl-6">
        {index}
      </TableCell>
      <TableCell className="py-3">
        <div className="flex items-center gap-2">
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-full ${meta.iconClass}`}
          >
            {meta.icon}
          </span>
          <Badge className={`px-2.5 py-1 text-xs font-semibold ${meta.badgeClass}`}>
            {meta.label}
          </Badge>
        </div>
      </TableCell>
      {showProduct && (
        <TableCell className="max-w-40 truncate py-3">
          {entry.productId ? (
            <Link
              href={`/admin/products/${entry.productId}/view`}
              className="font-bold hover:underline"
            >
              {entry.productName}
            </Link>
          ) : (
            <span className="font-bold">{entry.productName}</span>
          )}
        </TableCell>
      )}
      <TableCell className="py-3">
        {changes.length > 0 ? (
          <div className="min-w-56">
            <div className="grid grid-cols-[minmax(0,90px)_1fr_1fr] gap-x-2 border-b pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Field</span>
              <span>Old Value</span>
              <span>New Value</span>
            </div>
            {changes.map(([key, change]) => (
              <div
                key={key}
                className="grid grid-cols-[minmax(0,90px)_1fr_1fr] items-center gap-x-2 border-b border-dashed py-1 text-xs last:border-0"
              >
                <span className="truncate text-muted-foreground">{key}</span>
                <span className="truncate text-red-600 line-through dark:text-red-400">
                  {formatStatusValue(key, change.from)}
                </span>
                <span className="truncate text-emerald-600 dark:text-emerald-400">
                  {formatStatusValue(key, change.to)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="py-3">
        <div className="space-y-1">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="size-3.5 shrink-0" />
            {formatDateTime(entry.createdAt)}
          </span>
        </div>
      </TableCell>
      <TableCell className="py-3 pr-4 sm:pr-6">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <User className="size-3.5 shrink-0" />
          {entry.userName || "Unknown User"}
        </span>
      </TableCell>
    </TableRow>
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

  const hasActiveFilter = actionFilter !== "all";

  return (
    <div className="rounded-2xl border bg-card shadow-sm">
      {/* Card header (all-products page only; product view is already inside a titled section) */}
      {!productId && (
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
              <History className="size-5" />
            </span>
            <h2 className="text-lg font-bold sm:text-xl">
              <span className="text-blue-600 dark:text-blue-400">
                {totalItems}
              </span>{" "}
              history {totalItems === 1 ? "event" : "events"} across all products
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={actionFilter}
              onValueChange={(value) => {
                setCurrentPage(1);
                setActionFilter(value);
              }}
            >
              <SelectTrigger className="w-44 rounded-lg">
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
              className="rounded-lg"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-t border-dashed p-10 text-center">
          <History className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {hasActiveFilter
              ? "No matching events found."
              : "No product history recorded yet."}
          </p>
        </div>
      ) : (
        <Table className="min-w-205">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="py-3 pl-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:pl-6">
                #
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Action
              </TableHead>
              {!productId && (
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Product
                </TableHead>
              )}
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Changes
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Date &amp; Time
              </TableHead>
              <TableHead className="pr-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:pr-6">
                User
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry, idx) => (
              <HistoryRow
                key={entry.id}
                entry={entry}
                index={idx + 1}
                showProduct={!productId}
              />
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      {!productId && totalPages > 1 && (
        <div className="border-t p-4">
          <PaginationComponent
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </div>
  );
}
