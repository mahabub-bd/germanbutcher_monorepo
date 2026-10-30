"use client";

import { PaginationComponent } from "@/components/common/pagination";
import { TableSearch } from "@/components/common/table-search";
import StatsCard from "@/components/admin/dashboard/stats-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatDateTime } from "@/lib/utils";
import { fetchDataPagination } from "@/utils/api-utils";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  CalendarDays,
  ListFilter,
  PackageMinus,
  PackagePlus,
  RefreshCw,
  ShoppingCart,
  SlidersHorizontal,
  Undo2,
  User,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

interface StockMovementEntry {
  id: number;
  productId: number | null;
  productName: string;
  type:
    | "purchase"
    | "purchase_reversal"
    | "order_sale"
    | "order_cancel"
    | "adjustment";
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
type TypeFilter = MovementKind | "all";
type RangeKey = "all" | "today" | "7d" | "30d" | "90d";

interface MovementSummary {
  byType: Record<MovementKind, number>;
  total: number;
  unitsIn: number;
  unitsOut: number;
}

interface MovementsResponse {
  data: StockMovementEntry[];
  total: number;
  totalPages: number;
  summary?: MovementSummary;
}

const PAGE_SIZE = 15;

const INCREASE_CHIP =
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
const DECREASE_CHIP =
  "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300";

const KIND_META: Record<
  MovementKind,
  {
    label: string;
    icon: ReactNode;
    tileClass: string;
    colors: string;
    activeColors: string;
  }
> = {
  purchase: {
    label: "Purchase",
    icon: <PackagePlus className="size-3.5 sm:size-4" />,
    tileClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    colors:
      "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70",
    activeColors:
      "data-[state=active]:bg-emerald-600 data-[state=active]:text-white dark:data-[state=active]:bg-emerald-400 dark:data-[state=active]:text-emerald-950",
  },
  purchase_reversal: {
    label: "Purchase reversed",
    icon: <PackageMinus className="size-3.5 sm:size-4" />,
    tileClass: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
    colors:
      "bg-red-50 text-red-800 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70",
    activeColors:
      "data-[state=active]:bg-red-600 data-[state=active]:text-white dark:data-[state=active]:bg-red-400 dark:data-[state=active]:text-red-950",
  },
  order_sale: {
    label: "Sale",
    icon: <ShoppingCart className="size-3.5 sm:size-4" />,
    tileClass:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    colors:
      "bg-blue-50 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70",
    activeColors:
      "data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-400 dark:data-[state=active]:text-blue-950",
  },
  order_cancel: {
    label: "Order cancelled",
    icon: <Undo2 className="size-3.5 sm:size-4" />,
    tileClass:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    colors:
      "bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70",
    activeColors:
      "data-[state=active]:bg-amber-600 data-[state=active]:text-white dark:data-[state=active]:bg-amber-400 dark:data-[state=active]:text-amber-950",
  },
  adjustment: {
    label: "Adjustment",
    icon: <SlidersHorizontal className="size-3.5 sm:size-4" />,
    tileClass:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    colors:
      "bg-violet-50 text-violet-800 hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-950/70",
    activeColors:
      "data-[state=active]:bg-violet-600 data-[state=active]:text-white dark:data-[state=active]:bg-violet-400 dark:data-[state=active]:text-violet-950",
  },
};

const ALL_TAB_COLORS =
  "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-900";
const ALL_TAB_ACTIVE_COLORS =
  "data-[state=active]:bg-slate-800 data-[state=active]:text-white dark:data-[state=active]:bg-slate-200 dark:data-[state=active]:text-slate-900";

const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

/** Lower bound (ISO) for a quick date-range preset; open-ended above. */
function rangeToBounds(range: RangeKey): { dateFrom?: string } {
  if (range === "all") return {};

  const now = new Date();
  if (range === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { dateFrom: start.toISOString() };
  }

  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return { dateFrom: new Date(now.getTime() - days * 86_400_000).toISOString() };
}

function formatReference(entry: StockMovementEntry) {
  if (!entry.referenceType) return null;
  const label = entry.referenceType
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return entry.referenceId ? `${label} #${entry.referenceId}` : label;
}

function timeAgo(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const diff = Date.now() - then;
  if (diff < 60_000) return "just now";

  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  return months < 12 ? `${months}mo ago` : `${Math.floor(months / 12)}y ago`;
}

function initials(name?: string | null) {
  if (!name) return "?";
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return letters || "?";
}

function MovementIcon({
  kind,
  className,
}: {
  kind: MovementKind;
  className?: string;
}) {
  const meta = KIND_META[kind];
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg",
        meta.tileClass,
        className,
      )}
    >
      {meta.icon}
    </span>
  );
}

function QuantityChip({
  quantity,
  className,
}: {
  quantity: number;
  className?: string;
}) {
  const isIncrease = quantity > 0;
  return (
    <span
      className={cn(
        "inline-flex min-w-14 items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums",
        isIncrease ? INCREASE_CHIP : DECREASE_CHIP,
        className,
      )}
    >
      {isIncrease ? "+" : ""}
      {quantity}
    </span>
  );
}

/** "+12  14 → 26" — the delta first, the resulting stock level second. */
function StockChange({ entry }: { entry: StockMovementEntry }) {
  return (
    <div className="flex items-center gap-2.5">
      <QuantityChip quantity={entry.quantity} />
      <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
        <span>{entry.stockBefore}</span>
        <ArrowRight className="size-3" />
        <span className="font-semibold text-foreground">{entry.stockAfter}</span>
      </span>
    </div>
  );
}

function ProductCell({ entry }: { entry: StockMovementEntry }) {
  if (!entry.productId) {
    return (
      <span
        className="line-clamp-2 whitespace-normal text-sm font-medium"
        title={entry.productName}
      >
        {entry.productName}
      </span>
    );
  }

  return (
    <Link
      href={`/admin/products/${entry.productId}/view`}
      className="line-clamp-2 whitespace-normal text-sm font-medium hover:text-blue-600 hover:underline dark:hover:text-blue-400"
      title={entry.productName}
    >
      {entry.productName}
    </Link>
  );
}

function ReferenceCell({ entry }: { entry: StockMovementEntry }) {
  const reference = formatReference(entry);
  if (!entry.note && !reference) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="min-w-0">
      <p
        className="truncate text-sm text-foreground/80"
        title={entry.note ?? reference ?? undefined}
      >
        {entry.note ?? reference}
      </p>
      {entry.note && reference && (
        <p className="truncate text-[11px] text-muted-foreground">{reference}</p>
      )}
    </div>
  );
}

function UserCell({ name }: { name: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold uppercase text-muted-foreground">
        {initials(name)}
      </span>
      <span className="truncate text-sm text-foreground/80">
        {name || "System"}
      </span>
    </div>
  );
}

function MovementRow({
  entry,
  showProduct,
}: {
  entry: StockMovementEntry;
  showProduct: boolean;
}) {
  return (
    <TableRow className="transition-colors hover:bg-muted/40">
      <TableCell className="py-2.5 pl-4 sm:pl-5">
        <div className="flex items-center gap-2.5">
          <MovementIcon kind={entry.type} />
          <span className="whitespace-nowrap text-sm font-medium">
            {KIND_META[entry.type].label}
          </span>
        </div>
      </TableCell>

      {showProduct && (
        <TableCell className="max-w-60 py-2.5">
          <ProductCell entry={entry} />
        </TableCell>
      )}

      <TableCell className="py-2.5">
        <StockChange entry={entry} />
      </TableCell>

      <TableCell className="hidden max-w-65 py-2.5 lg:table-cell">
        <ReferenceCell entry={entry} />
      </TableCell>

      <TableCell className="whitespace-nowrap py-2.5">
        <p className="text-sm text-foreground/80">
          {formatDateTime(entry.createdAt)}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {timeAgo(entry.createdAt)}
        </p>
      </TableCell>

      <TableCell className="hidden py-2.5 pr-4 sm:pr-5 xl:table-cell">
        <UserCell name={entry.userName} />
      </TableCell>
    </TableRow>
  );
}

function MovementCard({
  entry,
  showProduct,
}: {
  entry: StockMovementEntry;
  showProduct: boolean;
}) {
  const reference = formatReference(entry);

  return (
    <li className="flex gap-3 px-4 py-3.5">
      <MovementIcon kind={entry.type} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {showProduct ? (
              <ProductCell entry={entry} />
            ) : (
              <p className="text-sm font-medium">
                {KIND_META[entry.type].label}
              </p>
            )}
            {(showProduct || reference) && (
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {showProduct ? KIND_META[entry.type].label : reference}
              </p>
            )}
          </div>
          <QuantityChip quantity={entry.quantity} className="shrink-0" />
        </div>

        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground tabular-nums">
          <span>Stock</span>
          <span>{entry.stockBefore}</span>
          <ArrowRight className="size-3" />
          <span className="font-semibold text-foreground">
            {entry.stockAfter}
          </span>
        </div>

        {entry.note && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {entry.note}
          </p>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3" />
            {formatDateTime(entry.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <User className="size-3" />
            {entry.userName || "System"}
          </span>
        </div>
      </div>
    </li>
  );
}

/** Same pill-tab treatment as the CRM customer-list segment tabs
 * (rounded-lg, tinted per type, solid active state). */
const SEGMENT_TAB_CLASS =
  "inline-flex h-auto flex-none items-center gap-1.5 rounded-lg border-0 px-3 py-1.5 text-xs font-semibold shadow-none transition-colors data-[state=active]:shadow-none sm:px-4 sm:py-2 sm:text-sm";

function SegmentTab({
  value,
  label,
  count,
  icon,
  colors,
  activeColors,
}: {
  value: string;
  label: string;
  count?: number;
  icon: ReactNode;
  colors: string;
  activeColors: string;
}) {
  return (
    <TabsTrigger
      value={value}
      className={cn(SEGMENT_TAB_CLASS, colors, activeColors)}
    >
      {icon}
      <span className="whitespace-nowrap">{label}</span>
      {typeof count === "number" && (
        <span className="rounded-full bg-black/10 px-1.5 py-px text-[10px] font-semibold tabular-nums dark:bg-white/10">
          {count}
        </span>
      )}
    </TabsTrigger>
  );
}

function TypeFilterChips({
  value,
  summary,
  allLabel = "All types",
  onChange,
}: {
  value: TypeFilter;
  summary: MovementSummary | null;
  allLabel?: string;
  onChange: (value: TypeFilter) => void;
}) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as TypeFilter)}>
      <TabsList className="h-auto w-full justify-start gap-1.5 overflow-x-auto rounded-none bg-transparent p-0 sm:gap-2 md:w-fit">
        <SegmentTab
          value="all"
          label={allLabel}
          count={summary?.total}
          icon={<ListFilter className="size-3.5 sm:size-4" />}
          colors={ALL_TAB_COLORS}
          activeColors={ALL_TAB_ACTIVE_COLORS}
        />
        {(Object.keys(KIND_META) as MovementKind[]).map((kind) => (
          <SegmentTab
            key={kind}
            value={kind}
            label={KIND_META[kind].label}
            count={summary?.byType?.[kind]}
            icon={KIND_META[kind].icon}
            colors={KIND_META[kind].colors}
            activeColors={KIND_META[kind].activeColors}
          />
        ))}
      </TabsList>
    </Tabs>
  );
}

function LoadingState() {
  return (
    <div className="divide-y">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 px-4 py-3.5">
          <Skeleton className="size-8 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-40 max-w-2/3" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-14 rounded-md" />
        </div>
      ))}
    </div>
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
  const [summary, setSummary] = useState<MovementSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [range, setRange] = useState<RangeKey>("all");

  // Ignore responses from superseded requests (fast filter/page changes).
  const fetchSeqRef = useRef(0);

  // Debounce the search box so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const next = searchInput.trim();
    if (next === searchQuery) return;

    const timer = setTimeout(() => {
      setSearchQuery(next);
      setCurrentPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput, searchQuery]);

  const fetchMovements = useCallback(async () => {
    const seq = ++fetchSeqRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: PAGE_SIZE.toString(),
      });

      if (productId) params.set("productId", productId.toString());
      if (searchQuery) params.set("search", searchQuery);
      if (typeFilter !== "all") params.set("type", typeFilter);

      const { dateFrom } = rangeToBounds(range);
      if (dateFrom) params.set("dateFrom", dateFrom);

      const response = await fetchDataPagination<MovementsResponse>(
        `products/stock-movements?${params.toString()}`,
      );
      if (seq !== fetchSeqRef.current) return;

      setEntries(response.data ?? []);
      setTotalItems(response.total ?? 0);
      setTotalPages(response.totalPages ?? 1);
      if (response.summary) setSummary(response.summary);
    } catch (err) {
      if (seq !== fetchSeqRef.current) return;
      console.error("Error fetching stock movements:", err);
      setEntries([]);
      setError("Could not load the stock movement ledger.");
    } finally {
      if (seq === fetchSeqRef.current) setIsLoading(false);
    }
  }, [productId, currentPage, searchQuery, typeFilter, range]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const showProduct = !productId;
  const hasFilters =
    Boolean(searchQuery) || typeFilter !== "all" || range !== "all";

  const clearFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setTypeFilter("all");
    setRange("all");
    setCurrentPage(1);
  };

  const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(currentPage * PAGE_SIZE, totalItems);

  const renderContent = () => {
    if (isLoading) return <LoadingState />;

    if (error) {
      return (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold">Something went wrong</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchMovements}>
            <RefreshCw className="mr-2 size-3.5" />
            Try again
          </Button>
        </div>
      );
    }

    if (entries.length === 0) {
      return (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted">
            <PackagePlus className="size-6 text-muted-foreground" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold">
              {hasFilters ? "No movements match these filters" : "Nothing here yet"}
            </p>
            <p className="mx-auto max-w-sm text-xs text-muted-foreground">
              {hasFilters
                ? productId
                  ? "Try a different movement type."
                  : "Try another product name, movement type or date range."
                : "Movements appear automatically once stock is purchased, sold, returned or manually adjusted."}
            </p>
          </div>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      );
    }

    return (
      <>
        {/* Desktop / tablet: ledger table */}
        <div className="hidden overflow-x-auto md:block">
          <Table className="min-w-0 text-sm">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="h-9 py-0 pl-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:pl-5">
                  Movement
                </TableHead>
                {showProduct && (
                  <TableHead className="h-9 py-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Product
                  </TableHead>
                )}
                <TableHead className="h-9 py-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Change
                </TableHead>
                <TableHead className="hidden h-9 py-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:table-cell">
                  Reference
                </TableHead>
                <TableHead className="h-9 py-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  When
                </TableHead>
                <TableHead className="hidden h-9 py-0 pr-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:pr-5 xl:table-cell">
                  By
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <MovementRow
                  key={entry.id}
                  entry={entry}
                  showProduct={showProduct}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile: stacked cards */}
        <ul className="divide-y md:hidden">
          {entries.map((entry) => (
            <MovementCard
              key={entry.id}
              entry={entry}
              showProduct={showProduct}
            />
          ))}
        </ul>
      </>
    );
  };

  return (
    <div className="space-y-4">
      {showProduct && (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatsCard
            icon={Activity}
            title="Movements"
            value={summary ? totalItems.toLocaleString("en-US") : "—"}
            description={
              hasFilters ? "Matching current filters" : "All recorded changes"
            }
            bgColor="blue"
          />
          <StatsCard
            icon={ArrowDownToLine}
            title="Units in"
            value={summary ? summary.unitsIn.toLocaleString("en-US") : "—"}
            description="Purchases, returns, restocks"
            bgColor="green"
          />
          <StatsCard
            icon={ArrowUpFromLine}
            title="Units out"
            value={summary ? summary.unitsOut.toLocaleString("en-US") : "—"}
            description="Sales, reversals, shrinkage"
            bgColor="red"
          />
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        {showProduct ? (
          <div className="flex flex-col gap-3 border-b p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <TableSearch
                wrapperClassName="w-full sm:max-w-xs"
                placeholder="Search by product name..."
                aria-label="Search stock movements by product name"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />

              <div className="flex items-center gap-2">
                <Select
                  value={range}
                  onValueChange={(value) => {
                    setRange(value as RangeKey);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger
                    size="sm"
                    className="w-full text-xs sm:w-36"
                    aria-label="Filter by date range"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RANGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchMovements}
                  disabled={isLoading}
                  className="shrink-0 gap-1.5"
                >
                  <RefreshCw
                    className={cn("size-3.5", isLoading && "animate-spin")}
                  />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
            </div>

            <TypeFilterChips
              value={typeFilter}
              summary={summary}
              onChange={(next) => {
                setTypeFilter(next);
                setCurrentPage(1);
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2 border-b p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">
                {isLoading && entries.length === 0
                  ? "Loading movements..."
                  : `${totalItems.toLocaleString("en-US")} movement${
                      totalItems === 1 ? "" : "s"
                    }`}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchMovements}
                disabled={isLoading}
                className="h-7 gap-1.5 px-2 text-xs"
              >
                <RefreshCw
                  className={cn("size-3.5", isLoading && "animate-spin")}
                />
                Refresh
              </Button>
            </div>

            <TypeFilterChips
              value={typeFilter}
              summary={summary}
              allLabel="All"
              onChange={(next) => {
                setTypeFilter(next);
                setCurrentPage(1);
              }}
            />
          </div>
        )}

        {renderContent()}

        {!isLoading && !error && totalItems > 0 && (
          <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground tabular-nums">
              Showing{" "}
              <span className="font-medium text-foreground">
                {firstItem}–{lastItem}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {totalItems.toLocaleString("en-US")}
              </span>{" "}
              {totalItems === 1 ? "movement" : "movements"}
            </p>
            {totalPages > 1 && (
              <PaginationComponent
                currentPage={currentPage}
                totalPages={totalPages}
                baseUrl="#"
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
