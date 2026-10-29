"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaginationComponent } from "@/components/common/pagination";
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
  ArrowRight,
  Calendar,
  Loader2,
  Package,
  PackageMinus,
  PackagePlus,
  RefreshCw,
  ShoppingCart,
  SlidersHorizontal,
  Undo2,
  User,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface StockMovementEntry {
  id: number;
  productId: number | null;
  productName: string;
  type: "purchase" | "purchase_reversal" | "order_sale" | "order_cancel" | "adjustment";
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  referenceType: string | null;
  referenceId: number | null;
  note: string | null;
  userId: number | null;
  userName: string | null;
  createdAt: string;
}

type MovementKind = StockMovementEntry["type"];

const KIND_META: Record<
  MovementKind,
  { label: string; iconClass: string; badgeClass: string; icon: React.ReactNode }
> = {
  purchase: {
    label: "Purchase",
    iconClass: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    badgeClass:
      "bg-emerald-100 text-emerald-700 border-0 dark:bg-emerald-500/15 dark:text-emerald-400",
    icon: <PackagePlus className="h-4 w-4" />,
  },
  purchase_reversal: {
    label: "Purchase Reversed",
    iconClass: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    badgeClass: "bg-red-100 text-red-700 border-0 dark:bg-red-500/15 dark:text-red-400",
    icon: <PackageMinus className="h-4 w-4" />,
  },
  order_sale: {
    label: "Sale",
    iconClass: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
    badgeClass: "bg-blue-100 text-blue-700 border-0 dark:bg-blue-500/15 dark:text-blue-400",
    icon: <ShoppingCart className="h-4 w-4" />,
  },
  order_cancel: {
    label: "Order Cancelled",
    iconClass: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
    badgeClass:
      "bg-amber-100 text-amber-700 border-0 dark:bg-amber-500/15 dark:text-amber-400",
    icon: <Undo2 className="h-4 w-4" />,
  },
  adjustment: {
    label: "Adjustment",
    iconClass: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
    badgeClass:
      "bg-violet-100 text-violet-700 border-0 dark:bg-violet-500/15 dark:text-violet-400",
    icon: <SlidersHorizontal className="h-4 w-4" />,
  },
};

function formatReference(entry: StockMovementEntry) {
  if (!entry.referenceType) return null;
  const label = entry.referenceType
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return entry.referenceId ? `${label} #${entry.referenceId}` : label;
}

function MovementRow({
  entry,
  index,
  showProduct,
}: {
  entry: StockMovementEntry;
  index: number;
  showProduct: boolean;
}) {
  const meta = KIND_META[entry.type];
  const isIncrease = entry.quantity > 0;
  const reference = formatReference(entry);

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
          <Badge className={`px-2.5 py-1 text-xs font-medium ${meta.badgeClass}`}>
            {meta.label}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="py-3">
        <span
          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
            isIncrease
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
              : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
          }`}
        >
          {isIncrease ? "+" : ""}
          {entry.quantity}
        </span>
      </TableCell>
      <TableCell className="py-3">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-sm font-normal text-muted-foreground">
            {entry.stockBefore}
          </span>
          <ArrowRight className="size-3.5 text-muted-foreground" />
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-sm font-semibold ${
              isIncrease
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
            }`}
          >
            {entry.stockAfter}
          </span>
        </div>
      </TableCell>
      {showProduct && (
        <TableCell className="max-w-40 truncate py-3">
          {entry.productId ? (
            <Link
              href={`/admin/products/${entry.productId}/view`}
              className="font-semibold hover:underline"
            >
              {entry.productName}
            </Link>
          ) : (
            <span className="font-semibold">{entry.productName}</span>
          )}
        </TableCell>
      )}
      <TableCell className="max-w-80 py-3">
        {/* Prefer the backend note (already contains the order/purchase number
            and reason); the generated "Order #id" label is only a fallback. */}
        {entry.note || reference ? (
          <p className="truncate">{entry.note ?? reference}</p>
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
          {entry.userName || "System"}
        </span>
      </TableCell>
    </TableRow>
  );
}

interface StockMovementHistoryProps {
  /** When set, shows movements of this one product only; otherwise all products. */
  productId?: number;
}

export default function StockMovementHistory({
  productId,
}: StockMovementHistoryProps) {
  const [entries, setEntries] = useState<StockMovementEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const PAGE_SIZE = 15;

  const fetchMovements = useCallback(async () => {
    setIsLoading(true);
    try {
      if (productId) {
        const response = await fetchDataPagination<{
          data: StockMovementEntry[];
        }>(`products/${productId}/stock-movements`);
        setEntries(response.data ?? []);
      } else {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: PAGE_SIZE.toString(),
        });
        const response = await fetchDataPagination<{
          data: StockMovementEntry[];
          total: number;
          totalPages: number;
        }>(`products/stock-movements?${params.toString()}`);
        setEntries(response.data ?? []);
        setTotalItems(response.total ?? 0);
        setTotalPages(response.totalPages ?? 1);
      }
    } catch (error) {
      console.error("Error fetching stock movements:", error);
      toast.error("Failed to load stock movements.");
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [productId, currentPage]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  return (
    <div className="rounded-2xl border bg-card shadow-sm">
      {/* Card header (all-products page only; product view is already inside a titled section) */}
      {!productId && (
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
              <Package className="size-5" />
            </span>
            <h2 className="text-lg font-semibold sm:text-xl">
              <span className="text-blue-600 dark:text-blue-400">
                {totalItems}
              </span>{" "}
              stock {totalItems === 1 ? "movement" : "movements"} across all
              products
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMovements}
            className="rounded-lg"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-t border-dashed p-10 text-center">
          <PackagePlus className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No stock movements recorded yet.
          </p>
        </div>
      ) : (
        <Table className="min-w-205">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="py-3 pl-4 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:pl-6">
                #
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Type
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Qty
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Stock (Before → After)
              </TableHead>
              {!productId && (
                <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Product
                </TableHead>
              )}
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Reference
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Date &amp; Time
              </TableHead>
              <TableHead className="pr-4 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:pr-6">
                User
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry, idx) => (
              <MovementRow
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
