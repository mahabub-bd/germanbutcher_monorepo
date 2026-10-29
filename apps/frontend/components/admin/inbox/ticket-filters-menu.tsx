"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContactPriority,
  ContactSource,
  ContactStatus,
} from "@/components/admin/inbox/ticket-shared";
import { AlertCircle, CheckCircle, Clock, Filter } from "lucide-react";

interface TicketFiltersMenuProps {
  statusFilter: string;
  sourceFilter: string;
  priorityFilter: string;
  onStatusChange: (status: string) => void;
  onSourceChange: (source: string) => void;
  onPriorityChange: (priority: string) => void;
  onClear: () => void;
}

const FILTER_BUTTON_BASE =
  "text-xs py-1.5 px-2 rounded-md border";
const FILTER_BUTTON_OFF =
  "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700";

function filterButtonClass(active: boolean) {
  return active
    ? `${FILTER_BUTTON_BASE} bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 text-blue-600 dark:text-blue-400`
    : `${FILTER_BUTTON_BASE} ${FILTER_BUTTON_OFF}`;
}

export function TicketFiltersMenu({
  statusFilter,
  sourceFilter,
  priorityFilter,
  onStatusChange,
  onSourceChange,
  onPriorityChange,
  onClear,
}: TicketFiltersMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 px-3 bg-transparent"
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
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Filters</h4>
            {statusFilter && statusFilter !== "all" && (
              <button
                onClick={onClear}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Status</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onStatusChange("all")}
                className={filterButtonClass(statusFilter === "all")}
              >
                All
              </button>
              <button
                onClick={() => onStatusChange(ContactStatus.PENDING)}
                className={`${FILTER_BUTTON_BASE} flex items-center justify-center gap-1 ${statusFilter === ContactStatus.PENDING
                  ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400"
                  : FILTER_BUTTON_OFF
                  }`}
              >
                <Clock className="h-2 w-2" />
                Pending
              </button>
              <button
                onClick={() => onStatusChange(ContactStatus.IN_PROGRESS)}
                className={`${FILTER_BUTTON_BASE} flex items-center justify-center gap-1 ${statusFilter === ContactStatus.IN_PROGRESS
                  ? "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                  : FILTER_BUTTON_OFF
                  }`}
              >
                <AlertCircle className="h-2 w-2" />
                In Progress
              </button>
              <button
                onClick={() => onStatusChange(ContactStatus.RESOLVED)}
                className={`${FILTER_BUTTON_BASE} flex items-center justify-center gap-1 ${statusFilter === ContactStatus.RESOLVED
                  ? "bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800 text-green-600 dark:text-green-400"
                  : FILTER_BUTTON_OFF
                  }`}
              >
                <CheckCircle className="h-2 w-2" />
                Resolved
              </button>
            </div>
          </div>

          {/* Source channel */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Source</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(ContactSource).map((source) => (
                <button
                  key={source}
                  onClick={() => onSourceChange(source)}
                  className={`${filterButtonClass(sourceFilter === source)} capitalize`}
                >
                  {source}
                </button>
              ))}
              <button
                onClick={() => onSourceChange("")}
                className={filterButtonClass(sourceFilter === "")}
              >
                All
              </button>
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Priority</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.values(ContactPriority).map((priority) => (
                <button
                  key={priority}
                  onClick={() => onPriorityChange(priority)}
                  className={`${filterButtonClass(priorityFilter === priority)} capitalize`}
                >
                  {priority}
                </button>
              ))}
              <button
                onClick={() => onPriorityChange("")}
                className={filterButtonClass(priorityFilter === "")}
              >
                All
              </button>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
