"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { fetchDataPagination } from "@/utils/api-utils";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  PackageMinus,
  PackagePlus,
  RefreshCw,
  ShoppingCart,
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
  type: "purchase" | "purchase_reversal" | "order_sale" | "order_cancel";
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
  { label: string; badgeClass: string; icon: React.ReactNode }
> = {
  purchase: {
    label: "Purchase",
    badgeClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    icon: <PackagePlus className="h-3 w-3" />,
  },
  purchase_reversal: {
    label: "Purchase Reversed",
    badgeClass: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
    icon: <PackageMinus className="h-3 w-3" />,
  },
  order_sale: {
    label: "Sale",
    badgeClass:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
    icon: <ShoppingCart className="h-3 w-3" />,
  },
  order_cancel: {
    label: "Order Cancelled",
    badgeClass:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    icon: <Undo2 className="h-3 w-3" />,
  },
};

function MovementEntry({
  entry,
  showProduct,
}: {
  entry: StockMovementEntry;
  showProduct: boolean;
}) {
  const meta = KIND_META[entry.type];
  const isIncrease = entry.quantity > 0;

  return (
    <li className="relative pl-10 pb-6 last:pb-0">
      {/* Timeline line + dot */}
      <span className="absolute left-[15px] top-6 bottom-0 w-px bg-border last:hidden" />
      <span className="absolute left-2 top-1 flex size-7 items-center justify-center rounded-full border bg-muted">
        {meta.icon}
      </span>

      {/* Single-line layout on desktop; stacks vertically on mobile */}
      <div className="flex flex-col items-start gap-1.5 md:flex-row md:flex-wrap md:items-center md:gap-2">
        <Badge className={`gap-1 border-0 ${meta.badgeClass}`}>
          {meta.icon}
          {meta.label}
        </Badge>
        <span
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${
            isIncrease
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {isIncrease ? "+" : ""}
          {entry.quantity}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-0.5 text-xs whitespace-nowrap">
          <span className="text-muted-foreground">Stock:</span>
          {entry.stockBefore}
          <ArrowRight className="size-3 text-muted-foreground" />
          <span className="font-medium">{entry.stockAfter}</span>
        </span>
        {showProduct &&
          (entry.productId ? (
            <Link
              href={`/admin/products/${entry.productId}/view`}
              className="max-w-[220px] truncate text-sm font-medium hover:underline"
            >
              {entry.productName}
            </Link>
          ) : (
            <span className="max-w-[220px] truncate text-sm font-medium">
              {entry.productName}
            </span>
          ))}

        {entry.note && (
          <span className="max-w-[260px] truncate text-xs text-muted-foreground">
            {entry.note}
          </span>
        )}

        <span className="text-sm text-muted-foreground whitespace-nowrap md:ml-auto">
          {formatDateTime(entry.createdAt)}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
          <User className="size-3 shrink-0" />
          {entry.userName || "System"}
        </span>
      </div>
    </li>
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
    <div className="space-y-4">
      {!productId && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {totalItems} stock{" "}
            {totalItems === 1 ? "movement" : "movements"} across all products
          </p>
          <Button variant="outline" size="sm" onClick={fetchMovements}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed rounded-xl p-10 text-center">
          <PackagePlus className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            No stock movements recorded yet.
          </p>
        </div>
      ) : (
        <ul className="mt-2">
          {entries.map((entry) => (
            <MovementEntry
              key={entry.id}
              entry={entry}
              showProduct={!productId}
            />
          ))}
        </ul>
      )}

      {!productId && totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((page) => page - 1)}
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((page) => page + 1)}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
