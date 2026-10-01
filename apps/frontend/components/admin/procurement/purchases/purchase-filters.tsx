"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Filter, Search, XCircle } from "lucide-react";

interface PurchaseFiltersProps {
  searchQuery: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (status: string) => void;
  onClearFilters: () => void;
}

export function PurchaseFilters({
  searchQuery,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onClearFilters,
}: PurchaseFiltersProps) {
  const hasFilters = searchQuery || statusFilter;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search purchases..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Status Filter Dropdown */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 px-3"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 p-3 rounded-lg shadow-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800"
              sideOffset={8}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Filters</h4>
                  {hasFilters && (
                    <button
                      onClick={onClearFilters}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Status Filter Options */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">
                    Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["all", "completed", "pending", "cancelled"].map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() =>
                            onStatusFilterChange(status === "all" ? "" : status)
                          }
                          className={`text-xs py-1.5 px-2 rounded-md border ${
                            (status === "all" && !statusFilter) ||
                            statusFilter === status
                              ? status === "all"
                                ? "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                                : status === "completed"
                                ? "bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800 text-green-600 dark:text-green-400"
                                : status === "pending"
                                ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400"
                                : "bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800 text-red-600 dark:text-red-400"
                              : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                          }`}
                        >
                          {status === "all" ? (
                            "All"
                          ) : (
                            <>
                              <span
                                className={`inline-block h-2 w-2 rounded-full mr-1 ${
                                  status === "completed"
                                    ? "bg-green-500"
                                    : status === "pending"
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                              />
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </>
                          )}
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

      {/* Active Filters Badges */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 mt-4">
          {searchQuery && (
            <Badge
              variant="outline"
              className="flex items-center gap-1 px-3 py-1"
            >
              Search: {searchQuery}
              <button
                onClick={() => onSearchChange("")}
                className="ml-1"
                aria-label="Clear search"
              >
                <XCircle className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {statusFilter && (
            <Badge
              variant="outline"
              className="flex items-center gap-1 px-3 py-1"
            >
              Status: {statusFilter}
              <button
                onClick={() => onStatusFilterChange("")}
                className="ml-1"
                aria-label="Clear status filter"
              >
                <XCircle className="h-3 w-3" />
              </button>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-7 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
