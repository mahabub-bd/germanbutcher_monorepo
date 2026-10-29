"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { PaginationComponent } from "@/components/common/pagination";
import { TableSearch } from "@/components/common/table-search";
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
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  CirclePlus,
  History,
  ListFilter,
  Package,
  Pencil,
  Power,
  PowerOff,
  RefreshCw,
  Trash2,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

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
type ActionFilter = EventKind | "all";
type RangeKey = "all" | "today" | "7d" | "30d" | "90d";

interface HistorySummary {
  byAction: Record<EventKind, number>;
  total: number;
  products: number;
  users: number;
}

interface HistoryResponse {
  data: ProductHistoryEntry[];
  total: number;
  totalPages: number;
  summary?: HistorySummary;
}

const PAGE_SIZE = 15;

const ACTION_META: Record<
  EventKind,
  {
    label: string;
    icon: ReactNode;
    tileClass: string;
    colors: string;
    activeColors: string;
  }
> = {
  created: {
    label: "Added",
    icon: <CirclePlus className="size-3.5 sm:size-4" />,
    tileClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    colors:
      "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70",
    activeColors:
      "data-[state=active]:bg-emerald-600 data-[state=active]:text-white dark:data-[state=active]:bg-emerald-400 dark:data-[state=active]:text-emerald-950",
  },
  updated: {
    label: "Edited",
    icon: <Pencil className="size-3.5 sm:size-4" />,
    tileClass: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    colors:
      "bg-blue-50 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70",
    activeColors:
      "data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-400 dark:data-[state=active]:text-blue-950",
  },
  activated: {
    label: "Activated",
    icon: <Power className="size-3.5 sm:size-4" />,
    tileClass:
      "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
    colors:
      "bg-teal-50 text-teal-800 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:hover:bg-teal-950/70",
    activeColors:
      "data-[state=active]:bg-teal-600 data-[state=active]:text-white dark:data-[state=active]:bg-teal-400 dark:data-[state=active]:text-teal-950",
  },
  deactivated: {
    label: "Deactivated",
    icon: <PowerOff className="size-3.5 sm:size-4" />,
    tileClass:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    colors:
      "bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70",
    activeColors:
      "data-[state=active]:bg-amber-600 data-[state=active]:text-white dark:data-[state=active]:bg-amber-400 dark:data-[state=active]:text-amber-950",
  },
  deleted: {
    label: "Deleted",
    icon: <Trash2 className="size-3.5 sm:size-4" />,
    tileClass: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
    colors:
      "bg-red-50 text-red-800 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70",
    activeColors:
      "data-[state=active]:bg-red-600 data-[state=active]:text-white dark:data-[state=active]:bg-red-400 dark:data-[state=active]:text-red-950",
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

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  productSku: "SKU",
  sellingPrice: "Selling price",
  purchasePrice: "Purchase price",
  stock: "Stock",
  isActive: "Status",
  isFeatured: "Featured",
  discountType: "Discount type",
  discountValue: "Discount value",
  discountStartDate: "Discount start",
  discountEndDate: "Discount end",
};

const PRICE_FIELDS = new Set([
  "sellingPrice",
  "purchasePrice",
  "discountValue",
]);
const DATE_FIELDS = new Set(["discountStartDate", "discountEndDate"]);

/** `sellingPrice` → "Selling price"; unknown keys fall back to word-splitting. */
function humanizeField(key: string) {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function formatFieldValue(key: string, value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (key === "isActive") return value ? "Active" : "Inactive";
  if (key === "discountType") {
    if (value === "percentage") return "Percentage (%)";
    if (value === "fixed") return "Fixed (৳)";
    return String(value);
  }
  if (PRICE_FIELDS.has(key)) {
    const amount = Number(value);
    if (!Number.isNaN(amount)) return `৳${amount.toLocaleString("en-US")}`;
  }
  if (DATE_FIELDS.has(key)) {
    const date = new Date(String(value));
    if (!Number.isNaN(date.getTime())) return formatDateTime(date);
  }
  return String(value);
}

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

  return formatDateTime(iso);
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

function EventBadge({ action }: { action: EventKind }) {
  const meta = ACTION_META[action];
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          meta.tileClass,
        )}
      >
        {meta.icon}
      </span>
      <span className="text-sm font-semibold">{meta.label}</span>
    </div>
  );
}

function ProductLink({
  entry,
  className,
}: {
  entry: ProductHistoryEntry;
  className?: string;
}) {
  // Deleted products have no detail page left to link to.
  if (!entry.productId || entry.action === "deleted") {
    return (
      <span className={cn("font-medium text-foreground", className)}>
        {entry.productName}
      </span>
    );
  }

  return (
    <Link
      href={`/admin/products/${entry.productId}/view`}
      className={cn(
        "line-clamp-2 whitespace-normal font-medium hover:underline",
        className,
      )}
    >
      {entry.productName}
    </Link>
  );
}

function UserCell({ name }: { name: string | null }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
        {initials(name)}
      </span>
      <span className="truncate text-xs text-muted-foreground">
        {name || "System"}
      </span>
    </span>
  );
}

function ChangeList({
  changes,
}: {
  changes: [string, { from: unknown; to: unknown }][];
}) {
  return (
    <div className="space-y-2 px-4 py-3 sm:px-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Field changes
      </p>
      <div className="divide-y overflow-hidden rounded-lg border bg-card">
        {changes.map(([key, change]) => {
          const from = formatFieldValue(key, change.from);
          const to = formatFieldValue(key, change.to);
          return (
            <div
              key={key}
              className="grid gap-1 px-3 py-2 text-xs sm:grid-cols-[minmax(0,10rem)_1fr] sm:items-center sm:gap-3"
            >
              <span className="font-medium text-muted-foreground">
                {humanizeField(key)}
              </span>
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="max-w-full truncate rounded bg-red-50 px-1.5 py-0.5 text-red-700 line-through dark:bg-red-500/10 dark:text-red-400">
                  {from ?? "—"}
                </span>
                <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
                <span className="max-w-full truncate rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  {to ?? "—"}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChangesToggle({
  count,
  open,
  onToggle,
}: {
  count: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="inline-flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {count} field{count === 1 ? "" : "s"}
      <ChevronDown
        className={cn("size-3.5 transition-transform", open && "rotate-180")}
      />
    </button>
  );
}

function HistoryRow({
  entry,
  showProduct,
}: {
  entry: ProductHistoryEntry;
  showProduct: boolean;
}) {
  const [open, setOpen] = useState(false);
  const changes = Object.entries(entry.changes ?? {});
  const expandable = changes.length > 0;

  return (
    <>
      <TableRow className="border-b">
        <TableCell className="py-3 pl-4 sm:pl-5">
          <EventBadge action={entry.action} />
        </TableCell>
        {showProduct && (
          <TableCell className="max-w-52 py-3">
            <ProductLink entry={entry} className="text-sm" />
          </TableCell>
        )}
        <TableCell className="py-3">
          {expandable ? (
            <ChangesToggle
              count={changes.length}
              open={open}
              onToggle={() => setOpen((value) => !value)}
            />
          ) : (
            <span className="text-xs text-muted-foreground">
              {entry.action === "created"
                ? "Product created"
                : entry.action === "deleted"
                  ? "Product deleted"
                  : "—"}
            </span>
          )}
        </TableCell>
        <TableCell className="py-3">
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-medium">
              {timeAgo(entry.createdAt)}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {formatDateTime(entry.createdAt)}
            </span>
          </div>
        </TableCell>
        <TableCell className="py-3 pr-4 sm:pr-5">
          <UserCell name={entry.userName} />
        </TableCell>
      </TableRow>
      {open && expandable && (
        <TableRow className="border-b bg-muted/20 hover:bg-muted/20">
          <TableCell colSpan={showProduct ? 5 : 4} className="p-0">
            <ChangeList changes={changes} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function HistoryCard({
  entry,
  showProduct,
}: {
  entry: ProductHistoryEntry;
  showProduct: boolean;
}) {
  const [open, setOpen] = useState(false);
  const changes = Object.entries(entry.changes ?? {});

  return (
    <li className="px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <EventBadge action={entry.action} />
        <span className="shrink-0 text-[11px] text-muted-foreground">
          {timeAgo(entry.createdAt)}
        </span>
      </div>

      {showProduct && (
        <div className="mt-2">
          <ProductLink entry={entry} className="text-sm" />
        </div>
      )}

      {changes.length > 0 && (
        <div className="mt-2">
          <ChangesToggle
            count={changes.length}
            open={open}
            onToggle={() => setOpen((value) => !value)}
          />
          {open && (
            <div className="-mx-4 mt-2">
              <ChangeList changes={changes} />
            </div>
          )}
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <CalendarDays className="size-3" />
          {formatDateTime(entry.createdAt)}
        </span>
        <span className="flex items-center gap-1">
          <User className="size-3" />
          {entry.userName || "System"}
        </span>
      </div>
    </li>
  );
}

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

function ActionTabs({
  value,
  summary,
  allLabel = "All actions",
  onChange,
}: {
  value: ActionFilter;
  summary: HistorySummary | null;
  allLabel?: string;
  onChange: (value: ActionFilter) => void;
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onChange(next as ActionFilter)}
    >
      <TabsList className="h-auto w-full justify-start gap-1.5 overflow-x-auto rounded-none bg-transparent p-0 sm:gap-2 md:w-fit">
        <SegmentTab
          value="all"
          label={allLabel}
          count={summary?.total}
          icon={<ListFilter className="size-3.5 sm:size-4" />}
          colors={ALL_TAB_COLORS}
          activeColors={ALL_TAB_ACTIVE_COLORS}
        />
        {(Object.keys(ACTION_META) as EventKind[]).map((kind) => (
          <SegmentTab
            key={kind}
            value={kind}
            label={ACTION_META[kind].label}
            count={summary?.byAction?.[kind]}
            icon={ACTION_META[kind].icon}
            colors={ACTION_META[kind].colors}
            activeColors={ACTION_META[kind].activeColors}
          />
        ))}
      </TabsList>
    </Tabs>
  );
}

function LoadingState() {
  return (
    <div className="divide-y">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 px-4 py-3.5">
          <Skeleton className="size-8 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-44 max-w-2/3" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-5 w-16 rounded-md" />
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
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");
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

  const fetchHistory = useCallback(async () => {
    const seq = ++fetchSeqRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: PAGE_SIZE.toString(),
      });

      if (productId) params.set("productId", productId.toString());
      if (actionFilter !== "all") params.set("action", actionFilter);
      if (searchQuery) params.set("search", searchQuery);

      const { dateFrom } = rangeToBounds(range);
      if (dateFrom) params.set("dateFrom", dateFrom);

      const response = await fetchDataPagination<HistoryResponse>(
        `products/history?${params.toString()}`,
      );
      if (seq !== fetchSeqRef.current) return;

      setEntries(response.data ?? []);
      setTotalItems(response.total ?? 0);
      setTotalPages(response.totalPages ?? 1);
      if (response.summary) setSummary(response.summary);
    } catch (err) {
      if (seq !== fetchSeqRef.current) return;
      console.error("Error fetching product history:", err);
      setEntries([]);
      setError("Could not load the product history.");
    } finally {
      if (seq === fetchSeqRef.current) setIsLoading(false);
    }
  }, [productId, currentPage, actionFilter, searchQuery, range]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const showProduct = !productId;
  const hasFilters =
    Boolean(searchQuery) || actionFilter !== "all" || range !== "all";

  const clearFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setActionFilter("all");
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
          <Button variant="outline" size="sm" onClick={fetchHistory}>
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
            <History className="size-6 text-muted-foreground" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold">
              {hasFilters ? "No events match these filters" : "Nothing here yet"}
            </p>
            <p className="mx-auto max-w-sm text-xs text-muted-foreground">
              {hasFilters
                ? "Try another product name, event type or date range."
                : "Events appear automatically when a product is created, edited, activated, deactivated or deleted."}
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
        {/* Desktop / tablet: audit table */}
        <div className="hidden overflow-x-auto md:block">
          <Table className="min-w-0 text-sm">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="h-9 py-0 pl-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:pl-5">
                  Event
                </TableHead>
                {showProduct && (
                  <TableHead className="h-9 py-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Product
                  </TableHead>
                )}
                <TableHead className="h-9 py-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Changes
                </TableHead>
                <TableHead className="h-9 py-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  When
                </TableHead>
                <TableHead className="h-9 py-0 pr-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:pr-5">
                  By
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <HistoryRow
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
            <HistoryCard
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
            icon={History}
            title="Total events"
            value={summary ? totalItems.toLocaleString("en-US") : "—"}
            description={
              hasFilters ? "Matching current filters" : "Recorded across all products"
            }
            bgColor="blue"
          />
          <StatsCard
            icon={Package}
            title="Products touched"
            value={summary ? summary.products.toLocaleString("en-US") : "—"}
            description="Distinct products in this view"
            bgColor="violet"
          />
          <StatsCard
            icon={Users}
            title="People involved"
            value={summary ? summary.users.toLocaleString("en-US") : "—"}
            description="Distinct admins who made changes"
            bgColor="green"
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
                aria-label="Search product history by product name"
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
                  onClick={fetchHistory}
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

            <ActionTabs
              value={actionFilter}
              summary={summary}
              onChange={(next) => {
                setActionFilter(next);
                setCurrentPage(1);
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2 border-b p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">
                {isLoading && entries.length === 0
                  ? "Loading events..."
                  : `${totalItems.toLocaleString("en-US")} event${
                      totalItems === 1 ? "" : "s"
                    }`}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchHistory}
                disabled={isLoading}
                className="h-7 gap-1.5 px-2 text-xs"
              >
                <RefreshCw
                  className={cn("size-3.5", isLoading && "animate-spin")}
                />
                Refresh
              </Button>
            </div>

            <ActionTabs
              value={actionFilter}
              summary={summary}
              allLabel="All"
              onChange={(next) => {
                setActionFilter(next);
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
              {totalItems === 1 ? "event" : "events"}
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
