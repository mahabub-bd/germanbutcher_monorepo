"use client";

import { PaginationComponent } from "@/components/common/pagination";
import { PillBadge } from "@/components/common/pill-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { fetchDataPagination, fetchProtectedData } from "@/utils/api-utils";
import type { UserActivity } from "@/utils/types";
import {
  Activity,
  RefreshCw,
  SlidersHorizontal,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../../loading-indicator";
import { PageHeader } from "../../page-header";
import { MethodPill, StatusPill, formatAction } from "./audit-visuals";

/**
 * Filter option lists. GET is deliberately absent — the backend never logs read
 * requests. Status and actor values mirror the API enums exactly.
 */
const ACTION_OPTIONS = [
  { value: "POST", label: "POST" },
  { value: "PATCH", label: "PATCH" },
  { value: "PUT", label: "PUT" },
  { value: "DELETE", label: "DELETE" },
  { value: "LOGIN", label: "LOGIN" },
];

const STATUS_OPTIONS = [
  { value: "success", label: "Success" },
  { value: "failure", label: "Failure" },
];

const USER_TYPE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "customer", label: "Customer" },
  { value: "system", label: "System" },
];

const optionLabel = (
  options: { value: string; label: string }[],
  value: string
) => options.find((option) => option.value === value)?.label ?? value;

interface UserActivityListProps {
  initialPage: number;
  initialLimit: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

export function UserActivityList({
  initialPage,
  initialLimit,
  initialSearchParams = {},
}: UserActivityListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [actionFilter, setActionFilter] = useState(
    getInitialParam("action") as string
  );
  const [entityTypeFilter, setEntityTypeFilter] = useState(
    getInitialParam("entityType") as string
  );
  // Both are supported by the endpoint but were not exposed in the UI.
  const [statusFilter, setStatusFilter] = useState(
    getInitialParam("status") as string
  );
  const [userTypeFilter, setUserTypeFilter] = useState(
    getInitialParam("userType") as string
  );
  const [entityTypes, setEntityTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(
    new Set()
  );

  // Below md the filters live in a bottom sheet instead of the toolbar strip.
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const toggleMessage = (id: number) => {
    setExpandedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();

    params.set("page", currentPage.toString());
    params.set("limit", limit.toString());

    if (actionFilter && actionFilter !== "all")
      params.set("action", actionFilter);

    if (entityTypeFilter) params.set("entityType", entityTypeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (userTypeFilter) params.set("userType", userTypeFilter);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [
    router,
    pathname,
    currentPage,
    limit,
    actionFilter,
    entityTypeFilter,
    statusFilter,
    userTypeFilter,
  ]);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());

      if (actionFilter && actionFilter !== "all")
        params.append("action", actionFilter);

      if (entityTypeFilter) params.append("entityType", entityTypeFilter);
      if (statusFilter) params.append("status", statusFilter);
      if (userTypeFilter) params.append("userType", userTypeFilter);

      const response = await fetchDataPagination<{
        data: UserActivity[];
        total: number;
        totalPages: number;
      }>(`user-activities?${params.toString()}`);
      setActivities(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching user activities:", error);
      toast.error("Failed to load user activities. Please try again.");
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    updateUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    limit,
    actionFilter,
    entityTypeFilter,
    statusFilter,
    userTypeFilter,
  ]);

  // Populate the entity filter from values actually present in the audit logs.
  useEffect(() => {
    fetchProtectedData<string[]>("user-activities/entity-types")
      .then(setEntityTypes)
      .catch(() => setEntityTypes([]));
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setActionFilter("");
    setEntityTypeFilter("");
    setStatusFilter("");
    setUserTypeFilter("");
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    actionFilter || entityTypeFilter || statusFilter || userTypeFilter
  );

  const activeFilterCount = [
    actionFilter,
    entityTypeFilter,
    statusFilter,
    userTypeFilter,
  ].filter(Boolean).length;

  /** Plain sentence instead of removable chips, so the toolbar stays on one line. */
  const activeFilterSummary = [
    actionFilter && `Method: ${actionFilter}`,
    entityTypeFilter && `Entity: ${entityTypeFilter}`,
    statusFilter && `Status: ${optionLabel(STATUS_OPTIONS, statusFilter)}`,
    userTypeFilter && `Actor: ${optionLabel(USER_TYPE_OPTIONS, userTypeFilter)}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const renderFilterSelect = (
    value: string,
    placeholder: string,
    allLabel: string,
    options: { value: string; label: string }[],
    onChange: (value: string) => void,
    triggerClass: string
  ) => (
    <Select
      value={value || "all"}
      onValueChange={(next) => {
        onChange(next === "all" ? "" : next);
        setCurrentPage(1);
      }}
    >
      <SelectTrigger className={triggerClass}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  /**
   * One source for the filter controls so the desktop strip and the mobile sheet
   * cannot drift apart — only the trigger sizing changes with the mode.
   */
  const renderFilterControls = (mode: "bar" | "sheet") => {
    const triggerClass =
      mode === "bar"
        ? "h-9 w-full text-xs font-medium 2xl:text-sm"
        : "h-11 w-full px-3 text-sm font-medium";

    return [
      {
        key: "action",
        label: "HTTP Method",
        barClass: "md:w-36 md:shrink-0",
        node: renderFilterSelect(
          actionFilter,
          "Method",
          "All methods",
          ACTION_OPTIONS,
          setActionFilter,
          triggerClass
        ),
      },
      {
        key: "entity",
        label: "Entity Type",
        barClass: "md:w-44 md:shrink-0",
        node: renderFilterSelect(
          entityTypeFilter,
          "Entity",
          "All entities",
          entityTypes.map((entityType) => ({
            value: entityType,
            label: entityType,
          })),
          setEntityTypeFilter,
          triggerClass
        ),
      },
      {
        key: "status",
        label: "Status",
        barClass: "md:w-36 md:shrink-0",
        node: renderFilterSelect(
          statusFilter,
          "Status",
          "Any status",
          STATUS_OPTIONS,
          setStatusFilter,
          triggerClass
        ),
      },
      {
        key: "userType",
        label: "Actor",
        barClass: "md:w-36 md:shrink-0",
        node: renderFilterSelect(
          userTypeFilter,
          "Actor",
          "Any actor",
          USER_TYPE_OPTIONS,
          setUserTypeFilter,
          triggerClass
        ),
      },
    ];
  };

  // Two-line date cell: date on top, time below (Dhaka timezone, matches utils.formatDateTime).
  const formatDate = (input: string | Date) => {
    const d = input instanceof Date ? input : new Date(input);
    return d.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Dhaka",
    });
  };

  const formatTime = (input: string | Date) => {
    const d = input instanceof Date ? input : new Date(input);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Dhaka",
    });
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
        <Activity className="size-6 text-muted-foreground" />
      </span>
      <h3 className="text-base font-semibold">No activities found</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {hasActiveFilters
          ? "No audit log entries match the selected filters."
          : "No user activities have been recorded yet."}
      </p>
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={clearFilters}
        >
          Clear filters
        </Button>
      )}
    </div>
  );

  const renderTableView = () => (
    <div className="hidden overflow-x-auto lg:block">
      <Table className="report-table min-w-225 lg:min-w-0 [&_td]:py-2.5 [&_th]:pb-3 [&_th]:pt-0">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-14">ID</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>User</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity: UserActivity) => {
            const { method, path } = formatAction(activity.action);
            return (
              <TableRow key={activity.id} className="hover:bg-muted/50">
                <TableCell>
                  <Link
                    href={`/admin/audit-log/${activity.id}`}
                    className="font-mono text-xs font-medium text-primary whitespace-nowrap hover:underline"
                    title="Open event details"
                  >
                    #{activity.id}
                  </Link>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium whitespace-nowrap">
                      {formatDate(activity.createdAt)}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTime(activity.createdAt)}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col items-start gap-1">
                    <MethodPill method={method} />
                    <Link
                      href={`/admin/audit-log/${activity.id}`}
                      className="max-w-44 truncate text-xs text-muted-foreground font-mono hover:text-primary hover:underline"
                      title={`Open details for ${activity.action}`}
                    >
                      {path}
                    </Link>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm capitalize">
                      {activity.entityType}
                    </span>
                    {activity.entityId && (
                      <span className="text-xs text-muted-foreground">
                        ID: {activity.entityId}
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <StatusPill status={activity.status} />
                </TableCell>

                <TableCell className="max-w-xs">
                  <span
                    className={`text-sm ${expandedMessages.has(activity.id)
                      ? "block whitespace-normal wrap-break-word"
                      : "line-clamp-2 cursor-pointer wrap-break-word"
                      }`}
                    title={
                      expandedMessages.has(activity.id)
                        ? undefined
                        : activity.message
                    }
                    onClick={() => toggleMessage(activity.id)}
                  >
                    {activity.message}
                  </span>
                </TableCell>

                <TableCell className="font-mono text-xs text-muted-foreground">
                  {activity.ipAddress || "unknown"}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 shrink-0 rounded-full border bg-muted flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {activity.user?.name || "Unknown User"}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {activity.userType}
                      </span>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  /**
   * Below lg the eight columns cannot fit a phone, so each event becomes a
   * compact card instead of forcing horizontal scroll.
   */
  const renderCardView = () => (
    <div className="divide-y lg:hidden">
      {activities.map((activity: UserActivity) => {
        const { method, path } = formatAction(activity.action);
        return (
          <article key={activity.id} className="space-y-2.5 p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Link
                    href={`/admin/audit-log/${activity.id}`}
                    className="font-mono text-xs font-semibold text-primary hover:underline"
                    title="Open event details"
                  >
                    #{activity.id}
                  </Link>
                  <MethodPill method={method} />
                  <StatusPill status={activity.status} />
                </div>
                <Link
                  href={`/admin/audit-log/${activity.id}`}
                  className="mt-1.5 block truncate font-mono text-xs text-muted-foreground hover:text-primary hover:underline"
                  title={`Open details for ${activity.action}`}
                >
                  {path || activity.entityType}
                </Link>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-medium whitespace-nowrap">
                  {formatDate(activity.createdAt)}
                </p>
                <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {formatTime(activity.createdAt)}
                </p>
              </div>
            </div>

            <p
              className="line-clamp-2 text-sm wrap-break-word"
              title={activity.message}
            >
              {activity.message}
            </p>

            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="min-w-0 truncate capitalize">
                {activity.entityType}
                {activity.entityId ? ` · #${activity.entityId}` : ""}
              </span>
              <span className="shrink-0 font-mono">
                {activity.ipAddress || "unknown"}
              </span>
            </div>

            <div className="flex min-w-0 items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border bg-muted">
                <User className="size-3.5 text-muted-foreground" />
              </span>
              <span className="min-w-0 truncate text-xs">
                {activity.user?.name || "Unknown User"}
                <span className="text-muted-foreground capitalize">
                  {" · "}
                  {activity.userType}
                </span>
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );

  const firstRow = activities.length ? (currentPage - 1) * limit + 1 : 0;
  const lastRow = Math.min(currentPage * limit, totalItems);

  return (
    <div className="w-full">
      <PageHeader
        title="Audit Log"
        description="Every write, auth and system event with its actor, entity, status and IP."
      >
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={fetchActivities}
        >
          <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </PageHeader>

      {/* Quick log switch: All / Admin / Customer — same userType filter as the Actor dropdown */}
      <div className="mb-4 flex items-center gap-1.5 overflow-x-auto pb-1 sm:gap-2">
        {[
          { value: "", label: "All Log" },
          { value: "admin", label: "Admin Log" },
          { value: "customer", label: "Customer Log" },
        ].map((tab) => {
          const active = userTypeFilter === tab.value;
          return (
            <button
              key={tab.label}
              onClick={() => {
                setUserTypeFilter(tab.value);
                setCurrentPage(1);
              }}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950 sm:px-4 sm:py-2 sm:text-sm",
                active
                  ? "bg-slate-800 text-white hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-200"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-900"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Toolbar: one line from md up, bottom sheet below it */}
      <div className="mb-4 rounded-xl border bg-card p-3 shadow-xs">
        <div className="flex flex-nowrap items-center gap-2 lg:gap-3">
          <div className="shrink-0 md:hidden">
            <Sheet
              open={filterSheetOpen}
              onOpenChange={setFilterSheetOpen}
            >
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5">
                  <SlidersHorizontal className="size-3.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge className="size-4.5 rounded-full px-0 text-[0.65rem] font-semibold">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="max-h-[82dvh] gap-0 overflow-y-auto rounded-t-2xl"
              >
                <SheetHeader className="border-b pr-14">
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>
                    Narrow the log by method, entity, status and actor.
                  </SheetDescription>
                </SheetHeader>

                {renderFilterControls("sheet").map((control) => (
                  <div key={control.key} className="px-4 pt-4">
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {control.label}
                    </p>
                    {control.node}
                  </div>
                ))}

                <SheetFooter className="sticky bottom-0 mt-4 flex-row border-t bg-background pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      clearFilters();
                      setFilterSheetOpen(false);
                    }}
                  >
                    Clear all
                  </Button>
                  <SheetClose asChild>
                    <Button className="flex-1">
                      {totalItems > 0
                        ? `Show ${totalItems.toLocaleString("en-US")} events`
                        : "Done"}
                    </Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>

          <div className="hidden min-w-0 flex-1 items-center gap-3 md:flex md:flex-wrap">
            {renderFilterControls("bar").map((control) => (
              <div key={control.key} className={control.barClass}>
                {control.node}
              </div>
            ))}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 shrink-0 text-xs font-medium text-muted-foreground 2xl:text-sm"
                onClick={clearFilters}
                title={activeFilterSummary}
              >
                <XCircle className="size-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold">Activity log</h3>
            <p className="text-xs text-muted-foreground">
              Dhaka time · newest first · {limit} per page
            </p>
          </div>
          <PillBadge className="font-medium tabular-nums">
            {totalItems.toLocaleString("en-US")} total
          </PillBadge>
        </div>

        {isLoading ? (
          <div className="p-6">
            <LoadingIndicator message="Loading activities..." />
          </div>
        ) : activities.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {renderTableView()}
            {renderCardView()}
          </>
        )}

        <div className="flex flex-col items-start gap-2 border-t px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground 2xl:text-sm">
            <span className="truncate">
              {totalItems > 0
                ? `Showing ${firstRow.toLocaleString("en-US")}–${lastRow.toLocaleString(
                  "en-US"
                )} of ${totalItems.toLocaleString("en-US")} events`
                : "No events to show"}
            </span>
            {hasActiveFilters && (
              <span className="min-w-0 truncate">· {activeFilterSummary}</span>
            )}
          </div>

          {totalPages > 1 && (
            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl="#"
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
