"use client";

import { PaginationComponent } from "@/components/common/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import type { UserActivity } from "@/utils/types";
import {
  Activity,
  Eye,
  Filter,
  MoreHorizontal,
  User,
  XCircle,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../../loading-indicator";
import { PageHeader } from "../../page-header";

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
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();

    params.set("page", currentPage.toString());
    params.set("limit", limit.toString());

    if (actionFilter && actionFilter !== "all")
      params.set("action", actionFilter);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, currentPage, limit, actionFilter]);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());

      if (actionFilter && actionFilter !== "all")
        params.append("action", actionFilter);

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
  }, []);

  useEffect(() => {
    fetchActivities();
    updateUrl();
  }, [currentPage, limit, actionFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setActionFilter("");
    setCurrentPage(1);
  };

  const getActionColor = (action: string) => {
    // Extract HTTP method from action string (e.g., "PATCH /v1/orders/:id/cancel" -> "PATCH")
    const httpMethod = action.split(' ')[0].toUpperCase();

    switch (httpMethod) {
      case "GET":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "POST":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "PATCH":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "DELETE":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "PUT":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "failed":
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const formatAction = (action: string) => {
    // Split action into method and path
    const parts = action.split(' ');
    if (parts.length >= 2) {
      const [method, ...pathParts] = parts;
      return {
        method: method.toUpperCase(),
        path: pathParts.join(' ')
      };
    }
    return { method: action, path: '' };
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Activity className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No activities found</h3>
      <p className="text-sm text-muted-foreground mt-2">
        {actionFilter
          ? "No activities match your filter criteria. Try different filters."
          : "No user activities have been recorded yet."}
      </p>
      {actionFilter && (
        <Button variant="outline" className="mt-4" onClick={clearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  );

  const renderActiveFilters = () => {
    const hasFilters = actionFilter;

    if (!hasFilters) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {actionFilter && actionFilter !== "all" && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Action: {actionFilter}
            <button onClick={() => setActionFilter("")} className="ml-1">
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

  const renderTableView = () => (
    <div className="md:p-6 p-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date & Time</TableHead>
            <TableHead className="hidden md:table-cell">Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="hidden md:table-cell">Message</TableHead>
            <TableHead className="hidden md:table-cell">IP Address</TableHead>
            <TableHead>User</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity: UserActivity) => {
            const { method, path } = formatAction(activity.action);
            return (
              <TableRow key={activity.id}>
                <TableCell className="text-sm">
                  {formatDateTime(activity.createdAt)}
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-col gap-1">
                    <Badge className={getActionColor(activity.action)}>
                      {method}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      {path}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{activity.entityType}</span>
                    {activity.entityId && (
                      <span className="text-xs text-muted-foreground">ID: {activity.entityId}</span>
                    )}
                  </div>
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  <Badge className={getStatusColor(activity.status)}>
                    {activity.status}
                  </Badge>
                </TableCell>

                <TableCell className="hidden md:table-cell text-sm max-w-xs truncate">
                  {activity.message}
                </TableCell>

                <TableCell className="hidden md:table-cell font-mono text-xs">
                  {activity.ipAddress || "N/A"}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {activity.user?.name || "Unknown User"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {activity.userType}
                      </span>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/admin/reports/activities/${activity.id}`)}>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="w-full md:p-6 p-2">
      <PageHeader
        title="User Activity"
        description="Monitor and track user activities across the system"
      />

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-end gap-4">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 px-3"
                >
                  <Filter className="h-4 w-4" />
                  <span>Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 p-3 rounded-lg shadow-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800"
                sideOffset={8}
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">HTTP Actions</h4>
                    {actionFilter && actionFilter !== "all" && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {/* Action Filter */}
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">
                      HTTP Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {["all", "GET", "POST", "PATCH", "DELETE"].map(
                        (action) => (
                          <button
                            key={action}
                            onClick={() => {
                              setActionFilter(action);
                              setCurrentPage(1);
                            }}
                            className={`text-xs py-1.5 px-2 rounded-md border ${
                              actionFilter === action
                                ? "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                                : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                            }`}
                          >
                            {action === "all" ? "All" : action}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {renderActiveFilters()}

        {isLoading ? (
          <LoadingIndicator message="Loading Activities..." />
        ) : activities.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="mt-6">{renderTableView()}</div>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground text-center md:text-left truncate">
            {`Showing ${activities.length} of ${totalItems} activities`}
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
  );
}
