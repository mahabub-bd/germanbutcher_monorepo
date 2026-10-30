"use client";

import { PaginationComponent } from "@/components/common/pagination";
import { TableSearch } from "@/components/common/table-search";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { AddTicketModal } from "@/components/admin/inbox/add-ticket-modal";
import {
  ContactStatus,
  type TicketStatistics,
} from "@/components/admin/inbox/ticket-shared";
import { TicketDetailModal } from "@/components/admin/inbox/ticket-detail-modal";
import { TicketFiltersMenu } from "@/components/admin/inbox/ticket-filters-menu";
import { TicketList } from "@/components/admin/inbox/ticket-list";
import { TicketStatsCards } from "@/components/admin/inbox/ticket-stats-cards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  XCircle,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
    if (searchQuery) params.set("search", searchQuery);
    if (statusFilter && statusFilter !== "all")
      params.set("status", statusFilter);
    if (sourceFilter && sourceFilter !== "all")
      params.set("source", sourceFilter);
    if (priorityFilter && priorityFilter !== "all")
      params.set("priority", priorityFilter);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, currentPage, limit, searchQuery, statusFilter, sourceFilter, priorityFilter]);

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
      if (searchQuery) params.append("search", searchQuery);
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

  useEffect(() => {
    fetchMessages();
    fetchStatistics();
  }, []);

  useEffect(() => {
    fetchMessages();
    updateUrl();
  }, [currentPage, limit, searchQuery, statusFilter, sourceFilter, priorityFilter]);

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

  const renderActiveFilters = () => {
    const hasFilters = searchQuery || statusFilter;
    if (!hasFilters) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {searchQuery && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Search: {searchQuery}
            <button onClick={() => setSearchQuery("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}
        {statusFilter && statusFilter !== "all" && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Status: {statusFilter.replace("_", " ")}
            <button onClick={() => setStatusFilter("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}
        {sourceFilter && sourceFilter !== "all" && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Source: {sourceFilter}
            <button onClick={() => setSourceFilter("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}
        {priorityFilter && priorityFilter !== "all" && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1 capitalize"
          >
            Priority: {priorityFilter}
            <button onClick={() => setPriorityFilter("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-7 text-xs"
        >
          Clear all
        </Button>
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <MessageSquare className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No contact messages found</h3>
      <p className="text-sm text-muted-foreground mt-2">
        {searchQuery || statusFilter
          ? "No messages match your search criteria. Try different filters."
          : "No contact messages have been received yet."}
      </p>
      {(searchQuery || statusFilter) && (
        <Button
          variant="outline"
          className="mt-4 bg-transparent"
          onClick={clearFilters}
        >
          Clear Filters
        </Button>
      )}
    </div>
  );

  return (
    <>
      <div className="w-full ">
        <PageHeader
          title="Support Tickets"
          description="Customer inquiries from all channels — assign, prioritize and resolve"
        >
          {can(MENU_URL, "canCreate") && (
            <Button size="sm" onClick={() => setIsAddTicketOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
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
              colors: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-900",
              activeColors: "bg-slate-800 text-white hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-200",
            },
            {
              value: ContactStatus.PENDING,
              label: "Open",
              count: statistics.byStatus.pending,
              icon: <MailOpen className="size-3.5 sm:size-4" />,
              colors: "bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70",
              activeColors: "bg-amber-500 text-white hover:bg-amber-500 dark:bg-amber-400 dark:text-amber-950 dark:hover:bg-amber-400",
            },
            {
              value: ContactStatus.IN_PROGRESS,
              label: "In Progress",
              count: statistics.byStatus.in_progress,
              icon: <Clock className="size-3.5 sm:size-4" />,
              colors: "bg-blue-50 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70",
              activeColors: "bg-blue-600 text-white hover:bg-blue-600 dark:bg-blue-400 dark:text-blue-950 dark:hover:bg-blue-400",
            },
            {
              value: ContactStatus.RESOLVED,
              label: "Resolved",
              count: statistics.byStatus.resolved,
              icon: <CheckCircle2 className="size-3.5 sm:size-4" />,
              colors: "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70",
              activeColors: "bg-emerald-600 text-white hover:bg-emerald-600 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-400",
            },
            {
              value: ContactStatus.CLOSED,
              label: "Closed",
              count: statistics.byStatus.closed,
              icon: <Archive className="size-3.5 sm:size-4" />,
              colors: "bg-rose-50 text-rose-800 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70",
              activeColors: "bg-rose-600 text-white hover:bg-rose-600 dark:bg-rose-400 dark:text-rose-950 dark:hover:bg-rose-400",
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

        <div className="space-y-4">
          <div className="flex flex-row justify-between gap-2 pt-3">
            <TableSearch
              wrapperClassName="w-full sm:max-w-xs min-w-0"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <div className="flex items-center gap-2">
              <TicketFiltersMenu
                statusFilter={statusFilter}
                sourceFilter={sourceFilter}
                priorityFilter={priorityFilter}
                onStatusChange={(value) => {
                  setStatusFilter(value === "all" ? "" : value);
                  setCurrentPage(1);
                }}
                onSourceChange={(value) => {
                  setSourceFilter(value);
                  setCurrentPage(1);
                }}
                onPriorityChange={(value) => {
                  setPriorityFilter(value);
                  setCurrentPage(1);
                }}
                onClear={clearFilters}
              />
            </div>
          </div>

          {renderActiveFilters()}

          {isLoading ? (
            <LoadingIndicator message="Loading Contact Messages..." />
          ) : messages.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="mt-6">
              <TicketList messages={messages} onView={handleViewDetails} />
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground text-center md:text-left truncate">
              {`Showing ${messages.length} of ${totalItems} messages`}
            </p>
          </div>
          <div className="flex-1 w-full md:w-auto">
            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl="#"
              onPageChange={handlePageChange}
            />
          </div>
        </div>
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
