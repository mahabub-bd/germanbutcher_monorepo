"use client";

import { AddTicketModal } from "@/components/admin/inbox/add-ticket-modal";
import { TicketDetailModal } from "@/components/admin/inbox/ticket-detail-modal";
import { TicketList } from "@/components/admin/inbox/ticket-list";
import {
  ContactPriority,
  ContactSource,
  ContactStatus,
  type TicketStatistics,
} from "@/components/admin/inbox/ticket-shared";
import { TicketStatsCards } from "@/components/admin/inbox/ticket-stats-cards";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { PaginationComponent } from "@/components/common/pagination";
import { PillBadge } from "@/components/common/pill-badge";
import { TableSearch } from "@/components/common/table-search";
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
import { cn } from "@/lib/utils";
import { fetchDataPagination, fetchProtectedData } from "@/utils/api-utils";
import type { ContactMessage } from "@/utils/types";
import {
  Archive,
  CheckCircle2,
  Clock,
  Inbox,
  MailOpen,
  MessageSquare,
  Plus,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

interface ContactMessageListProps {
  initialPage: number;
  initialLimit: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

const EMPTY_STATS: TicketStatistics = {
  total: 0,
  byStatus: { pending: 0, in_progress: 0, resolved: 0, closed: 0 },
};

/** "in_progress" → "In Progress" — used by the active filter summary. */
const labelize = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function ContactMessageList({
  initialPage,
  initialLimit,
  initialSearchParams = {},
}: ContactMessageListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const MENU_URL = "/admin/inbox";
  const { can } = usePermissions();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState(
    getInitialParam("search") as string
  );
  // Applied 400ms after typing stops — the input stays instant, the API call
  // doesn't fire per keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState(
    getInitialParam("search") as string
  );
  const [statusFilter, setStatusFilter] = useState(
    getInitialParam("status") as string
  );
  const [sourceFilter, setSourceFilter] = useState(
    getInitialParam("source") as string
  );
  const [priorityFilter, setPriorityFilter] = useState(
    getInitialParam("priority") as string
  );
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);

  // Below md the filters live in a bottom sheet instead of the toolbar strip.
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMessageForDetail, setSelectedMessageForDetail] =
    useState<ContactMessage | null>(null);

  const [isAddTicketOpen, setIsAddTicketOpen] = useState(false);

  const [statistics, setStatistics] = useState<TicketStatistics>(EMPTY_STATS);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", currentPage.toString());
    params.set("limit", limit.toString());
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter && statusFilter !== "all")
      params.set("status", statusFilter);
    if (sourceFilter && sourceFilter !== "all")
      params.set("source", sourceFilter);
    if (priorityFilter && priorityFilter !== "all")
      params.set("priority", priorityFilter);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [
    router,
    pathname,
    currentPage,
    limit,
    debouncedSearch,
    statusFilter,
    sourceFilter,
    priorityFilter,
  ]);

  const fetchStatistics = async () => {
    setIsLoadingStats(true);
    try {
      const response = await fetchProtectedData<TicketStatistics>(
        "contact-messages/statistics"
      );
      setStatistics(response);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      toast.error("Failed to load statistics");
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter && statusFilter !== "all")
        params.append("status", statusFilter);
      if (sourceFilter && sourceFilter !== "all")
        params.append("source", sourceFilter);
      if (priorityFilter && priorityFilter !== "all")
        params.append("priority", priorityFilter);

      const response = await fetchDataPagination<{
        data: ContactMessage[];
        total: number;
        totalPages: number;
      }>(`contact-messages?${params.toString()}`);

      setMessages(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching contact messages:", error);
      toast.error("Failed to load contact messages. Please try again.");
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce the search box so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Dashboard totals load once; the list refetches on every applied filter.
  useEffect(() => {
    fetchStatistics();
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [
    currentPage,
    limit,
    debouncedSearch,
    statusFilter,
    sourceFilter,
    priorityFilter,
  ]);

  // Sync the URL only for user-driven changes, not on first paint.
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    updateUrl();
  }, [updateUrl]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewDetails = (message: ContactMessage) => {
    setSelectedMessageForDetail(message);
    setIsDetailModalOpen(true);
  };

  const updateDetailMessage = (updated: ContactMessage) => {
    setSelectedMessageForDetail(updated);
    setMessages((prev) =>
      prev.map((msg) => (msg.id === updated.id ? updated : msg))
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setSourceFilter("");
    setPriorityFilter("");
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const hasActiveFilters = () =>
    Boolean(searchQuery || statusFilter || sourceFilter || priorityFilter);

  const activeFilterSummary = [
    debouncedSearch && `Search: ${debouncedSearch}`,
    statusFilter && statusFilter !== "all" && `Status: ${labelize(statusFilter)}`,
    sourceFilter && sourceFilter !== "all" && `Source: ${labelize(sourceFilter)}`,
    priorityFilter &&
    priorityFilter !== "all" &&
    `Priority: ${labelize(priorityFilter)}`,
  ]
    .filter(Boolean)
    .join(" · ");

  // Count surfaced on the mobile Filters button so a closed sheet still shows
  // that the inbox is narrowed.
  const activeFilterCount = [
    Boolean(searchQuery),
    Boolean(statusFilter),
    Boolean(sourceFilter),
    Boolean(priorityFilter),
  ].filter(Boolean).length;

  const firstRow = messages.length === 0 ? 0 : (currentPage - 1) * limit + 1;
  const lastRow = Math.min(currentPage * limit, totalItems);

  // One source of truth for the filter controls: the toolbar renders them
  // inline at their fixed widths, the mobile sheet renders the same nodes full
  // width under a visible label. Status appears both here and on the tab strip
  // above so the toolbar matches the other admin lists.
  const renderFilterControls = (mode: "bar" | "sheet") => {
    const triggerClass =
      mode === "bar"
        ? "h-9 w-full"
        : "h-11 w-full px-3 text-sm font-medium";

    return [
      {
        key: "status",
        label: "Status",
        barClass: "md:w-44 md:shrink-0",
        node: (
          <Select
            value={statusFilter || "all"}
            onValueChange={(value) => {
              setStatusFilter(value === "all" ? "" : value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.values(ContactStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {labelize(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        key: "source",
        label: "Source",
        barClass: "md:w-40 md:shrink-0",
        node: (
          <Select
            value={sourceFilter || "all"}
            onValueChange={(value) => {
              setSourceFilter(value === "all" ? "" : value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {Object.values(ContactSource).map((source) => (
                <SelectItem key={source} value={source} className="capitalize">
                  {labelize(source)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        key: "priority",
        label: "Priority",
        barClass: "md:w-36 md:shrink-0",
        node: (
          <Select
            value={priorityFilter || "all"}
            onValueChange={(value) => {
              setPriorityFilter(value === "all" ? "" : value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {Object.values(ContactPriority).map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {labelize(priority)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
    ];
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
      <div className="rounded-full bg-muted p-3">
        <MessageSquare className="size-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold">No tickets found</p>
        <p className="text-xs text-muted-foreground">
          {hasActiveFilters()
            ? "No ticket matches these filters. Try another search, source or priority."
            : "New customer inquiries show up here as soon as they arrive."}
        </p>
      </div>
      {hasActiveFilters() ? (
        <Button variant="outline" size="sm" onClick={clearFilters}>
          Clear filters
        </Button>
      ) : can(MENU_URL, "canCreate") ? (
        <Button size="sm" onClick={() => setIsAddTicketOpen(true)}>
          <Plus className="size-4" /> Add ticket
        </Button>
      ) : null}
    </div>
  );

  return (
    <>
      <div className="w-full">
        <PageHeader
          title="Support Tickets"
          description="Customer inquiries from all channels — assign, prioritize and resolve"
        >
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={fetchMessages}
          >
            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>
          {can(MENU_URL, "canCreate") && (
            <Button size="sm" onClick={() => setIsAddTicketOpen(true)}>
              <Plus className="size-4" />
              <span className="hidden sm:inline">Add Ticket</span>
            </Button>
          )}
        </PageHeader>

        <TicketStatsCards statistics={statistics} isLoading={isLoadingStats} />

        {/* Status tabs (mockup style) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:gap-2">
          {[
            {
              value: "all",
              label: "All",
              count: statistics.total,
              icon: <Inbox className="size-3.5 sm:size-4" />,
              colors:
                "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-900",
              activeColors:
                "bg-slate-800 text-white hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-200",
            },
            {
              value: ContactStatus.PENDING,
              label: "Open",
              count: statistics.byStatus.pending,
              icon: <MailOpen className="size-3.5 sm:size-4" />,
              colors:
                "bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70",
              activeColors:
                "bg-amber-500 text-white hover:bg-amber-500 dark:bg-amber-400 dark:text-amber-950 dark:hover:bg-amber-400",
            },
            {
              value: ContactStatus.IN_PROGRESS,
              label: "In Progress",
              count: statistics.byStatus.in_progress,
              icon: <Clock className="size-3.5 sm:size-4" />,
              colors:
                "bg-blue-50 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70",
              activeColors:
                "bg-blue-600 text-white hover:bg-blue-600 dark:bg-blue-400 dark:text-blue-950 dark:hover:bg-blue-400",
            },
            {
              value: ContactStatus.RESOLVED,
              label: "Resolved",
              count: statistics.byStatus.resolved,
              icon: <CheckCircle2 className="size-3.5 sm:size-4" />,
              colors:
                "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70",
              activeColors:
                "bg-emerald-600 text-white hover:bg-emerald-600 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-400",
            },
            {
              value: ContactStatus.CLOSED,
              label: "Closed",
              count: statistics.byStatus.closed,
              icon: <Archive className="size-3.5 sm:size-4" />,
              colors:
                "bg-rose-50 text-rose-800 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70",
              activeColors:
                "bg-rose-600 text-white hover:bg-rose-600 dark:bg-rose-400 dark:text-rose-950 dark:hover:bg-rose-400",
            },
          ].map((tab) => {
            const active =
              statusFilter === tab.value ||
              (tab.value === "all" && !statusFilter);
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value === "all" ? "" : tab.value);
                  setCurrentPage(1);
                }}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950 sm:px-4 sm:py-2 sm:text-sm ${active ? tab.activeColors : tab.colors}`}
              >
                {tab.icon}
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="mt-3 mb-6 rounded-xl border bg-card p-3 shadow-xs">
          <div className="flex flex-col gap-2.5 md:flex-row md:flex-wrap md:items-center md:gap-3">
            {/* Search and the Filters button share one line on phones;
                md:contents hands both back to the toolbar row from md up. */}
            <div className="flex items-center gap-2 md:contents">
              <TableSearch
                wrapperClassName="w-full md:max-w-xs"
                className="h-9"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={handleSearchChange}
              />

              <div className="shrink-0 md:hidden">
                <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
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
                        Narrow the inbox by status, source channel and priority.
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
                            ? `Show ${totalItems.toLocaleString("en-US")} tickets`
                            : "Done"}
                        </Button>
                      </SheetClose>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            <div className="hidden items-center gap-3 md:flex md:flex-wrap">
              {renderFilterControls("bar").map((control) => (
                <div key={control.key} className={control.barClass}>
                  {control.node}
                </div>
              ))}
            </div>

            {hasActiveFilters() && (
              <div className="hidden min-w-0 items-center gap-2 md:flex md:ml-auto">
                <PillBadge className="font-medium" title={activeFilterSummary}>
                  <span className="truncate">{activeFilterSummary}</span>
                </PillBadge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 shrink-0 text-muted-foreground"
                  onClick={clearFilters}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingIndicator message="Loading Contact Messages..." />
          </div>
        ) : messages.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <TicketList messages={messages} onView={handleViewDetails} />

            <div className="mt-3 flex flex-col items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 md:flex-row">
              <p className="text-[13px] text-foreground/70">
                Showing {firstRow.toLocaleString("en-US")}–
                {lastRow.toLocaleString("en-US")} of{" "}
                {totalItems.toLocaleString("en-US")} ticket
                {totalItems === 1 ? "" : "s"}
                {debouncedSearch && ` matching “${debouncedSearch}”`}
              </p>
              {totalPages > 1 && (
                <PaginationComponent
                  currentPage={currentPage}
                  totalPages={totalPages}
                  baseUrl="#"
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          </>
        )}
      </div>

      <AddTicketModal
        open={isAddTicketOpen}
        onClose={() => setIsAddTicketOpen(false)}
        onAdded={() => {
          fetchMessages();
          fetchStatistics();
        }}
      />

      <TicketDetailModal
        message={isDetailModalOpen ? selectedMessageForDetail : null}
        canEdit={can(MENU_URL, "canEdit")}
        onClose={() => setIsDetailModalOpen(false)}
        onUpdate={updateDetailMessage}
        onRefreshList={fetchMessages}
        onRefreshStats={fetchStatistics}
      />
    </>
  );
}
