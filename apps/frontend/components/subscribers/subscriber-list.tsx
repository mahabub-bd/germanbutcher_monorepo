"use client";

import type React from "react";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { PillBadge } from "@/components/common/pill-badge";
import { PaginationComponent } from "@/components/common/pagination";
import { TableSearch } from "@/components/common/table-search";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn, formatDateTime } from "@/lib/utils";
import { deleteData, fetchDataPagination } from "@/utils/api-utils";
import type { Subscriber } from "@/utils/types";
import {
  CalendarPlus,
  Mail,
  MailPlus,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../admin/delete-confirmation-dialog";
import { LoadingIndicator } from "../admin/loading-indicator";
import { PageHeader } from "../admin/page-header";

interface SubscriberListProps {
  initialPage?: number;
  initialLimit?: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

export function SubscriberList({
  initialPage = 1,
  initialLimit = 10,
  initialSearchParams = {},
}: SubscriberListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const MENU_URL = "/admin/settings/subscriber-list";
  const { can } = usePermissions();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [searchQuery, setSearchQuery] = useState(
    getInitialParam("search") as string
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] =
    useState<Subscriber | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();

    params.set("page", currentPage.toString());
    params.set("limit", limit.toString());
    if (searchQuery) params.set("search", searchQuery);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, currentPage, limit, searchQuery]);

  const fetchSubscribers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetchDataPagination<{
        data: Subscriber[];
        total: number;
        totalPages: number;
      }>(`subscribers?${params.toString()}`);

      setSubscribers(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      toast.error("Failed to load subscribers. Please try again.");
      setSubscribers([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, limit, searchQuery]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleDeleteClick = (subscriber: Subscriber) => {
    setSelectedSubscriber(subscriber);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedSubscriber) return;

    try {
      await deleteData("subscribers", selectedSubscriber.id);
      fetchSubscribers();
      toast.success("Subscriber deleted successfully");
    } catch (error) {
      console.error("Error deleting subscriber:", error);
      toast.error("Failed to delete subscriber. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  // Sign-ups on the visible page that fall in the current calendar month.
  const now = new Date();
  const thisMonthCount = subscribers.filter((subscriber) => {
    if (!subscriber.createdAt) return false;
    const joined = new Date(subscriber.createdAt);
    return (
      joined.getMonth() === now.getMonth() &&
      joined.getFullYear() === now.getFullYear()
    );
  }).length;

  const firstRow = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const lastRow = Math.min(currentPage * limit, totalItems);

  const renderActions = (subscriber: Subscriber) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {can(MENU_URL, "canDelete") && (
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDeleteClick(subscriber)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderAvatar = (subscriber: Subscriber, className?: string) => (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted text-sm font-semibold uppercase text-muted-foreground",
        className
      )}
    >
      {subscriber.email?.charAt(0) || <Mail className="h-5 w-5" />}
    </span>
  );

  return (
    <>
      <div className="w-full">
        <PageHeader
          title="Subscribers"
          description="Everyone who signed up for the newsletter from the storefront."
        >
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={fetchSubscribers}
          >
            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </PageHeader>

        {/* Toolbar */}
        <div className="mb-6 rounded-xl border bg-card p-3 shadow-xs">
          <div className="flex flex-col gap-2.5 md:flex-row md:flex-nowrap md:items-center md:gap-3">
            <TableSearch
              wrapperClassName="w-full md:max-w-xs"
              className="h-9"
              placeholder="Search by email..."
              value={searchQuery}
              onChange={handleSearchChange}
            />

            <div className="md:w-35 md:shrink-0">
              <Select
                value={limit.toString()}
                onValueChange={(value) => {
                  setLimit(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {searchQuery && (
              <div className="flex items-center gap-2 md:ml-auto">
                <PillBadge className="font-medium">
                  Search: {searchQuery}
                </PillBadge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-muted-foreground"
                  onClick={clearSearch}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingIndicator message="Loading subscribers..." />
          </div>
        ) : subscribers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <Mail className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">No subscribers found</p>
              <p className="text-xs text-muted-foreground">
                {searchQuery
                  ? "No subscriber matches this email. Try a different search."
                  : "Nobody has subscribed to the newsletter yet."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={searchQuery ? clearSearch : fetchSubscribers}
            >
              {searchQuery ? "Clear search" : "Refresh"}
            </Button>
          </div>
        ) : (
          <>
            {/* Range totals */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatsCard
                icon={Users}
                title="Total subscribers"
                value={totalItems.toLocaleString("en-US")}
                description={`Page ${currentPage} of ${Math.max(totalPages, 1)}`}
                bgColor="blue"
              />
              <StatsCard
                icon={MailPlus}
                title="Showing"
                value={subscribers.length.toLocaleString("en-US")}
                description={`Of ${totalItems.toLocaleString("en-US")} subscribers`}
                bgColor="purple"
              />
              <StatsCard
                icon={CalendarPlus}
                title="Joined this month"
                value={thisMonthCount.toLocaleString("en-US")}
                description="On this page"
                bgColor="green"
              />
            </div>

            {/* Subscribers */}
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold">Subscribers</h3>
                  <p className="text-xs text-muted-foreground">
                    Newsletter sign-ups · {limit} per page
                  </p>
                </div>
                <PillBadge className="font-medium tabular-nums">
                  {totalItems.toLocaleString("en-US")} total
                </PillBadge>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block">
                <Table className="report-table">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-4">Email</TableHead>
                      <TableHead>Subscribed</TableHead>
                      <TableHead className="pr-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscribers.map((subscriber) => (
                      <TableRow key={subscriber.id}>
                        <TableCell className="py-2.5 pl-4">
                          <span className="flex items-center gap-3 font-medium">
                            {renderAvatar(subscriber, "h-8 w-8")}
                            <span className="truncate">{subscriber.email}</span>
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {subscriber.createdAt
                            ? formatDateTime(subscriber.createdAt)
                            : "N/A"}
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          {renderActions(subscriber)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y md:hidden">
                {subscribers.map((subscriber) => (
                  <article key={subscriber.id} className="space-y-3 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        {renderAvatar(subscriber, "h-9 w-9")}
                        <p className="truncate text-sm font-semibold">
                          {subscriber.email}
                        </p>
                      </div>
                      {renderActions(subscriber)}
                    </div>

                    <div className="rounded-lg bg-muted/40 p-2.5">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Subscribed
                      </p>
                      <p className="text-sm">
                        {subscriber.createdAt
                          ? formatDateTime(subscriber.createdAt)
                          : "N/A"}
                      </p>
                    </div>
                  </article>
                ))}
              </div>

              {/* Footer: what the list covers */}
              <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 md:flex-row">
                <p className="text-xs text-muted-foreground">
                  Showing {firstRow.toLocaleString("en-US")}–
                  {lastRow.toLocaleString("en-US")} of{" "}
                  {totalItems.toLocaleString("en-US")} subscriber
                  {totalItems === 1 ? "" : "s"}
                  {searchQuery && ` matching “${searchQuery}”`}
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
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
