"use client";

import { PaginationComponent } from "@/components/common/pagination";
import { Button } from "@/components/ui/button";
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
import { formatDateTime } from "@/lib/utils";
import { fetchDataPagination, patchData } from "@/utils/api-utils";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  Loader2,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

type ActivityStatus = "open" | "completed";

interface TaskItem {
  id: number;
  userId: number;
  user?: { id: number; name: string; mobileNumber: string | null } | null;
  type: "task";
  title: string;
  description: string | null;
  dueDate: string | null;
  status: ActivityStatus;
  completedAt: string | null;
  createdAt: string;
  createdBy?: { id: number; name: string } | null;
}

interface ListResponse {
  data: TaskItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "completed", label: "Completed" },
  { value: "all", label: "All statuses" },
];

const STATUS_STYLES: Record<ActivityStatus, string> = {
  open: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  completed:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

interface CrmTaskListProps {
  initialStatus?: string;
  initialOverdue?: boolean;
}

export function CrmTaskList({
  initialStatus = "open",
  initialOverdue = false,
}: CrmTaskListProps) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [overdueOnly, setOverdueOnly] = useState(initialOverdue);
  const [busyTaskId, setBusyTaskId] = useState<number | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        type: "task",
        page: String(currentPage),
        limit: String(PAGE_SIZE),
      });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (overdueOnly) params.set("overdue", "true");
      const res = await fetchDataPagination<ListResponse>(
        `crm/activities?${params.toString()}`
      );
      setTasks(res.data);
      setTotalPages(res.totalPages ?? 1);
      setTotalItems(res.total ?? 0);
    } catch {
      toast.error("Failed to load tasks.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, overdueOnly]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggleStatus = async (task: TaskItem) => {
    setBusyTaskId(task.id);
    try {
      await patchData(`crm/activities/${task.id}`, {
        status: task.status === "open" ? "completed" : "open",
      });
      toast.success(
        task.status === "open" ? "Task completed." : "Task reopened."
      );
      fetchTasks();
    } catch {
      toast.error("Failed to update task.");
    } finally {
      setBusyTaskId(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="CRM Tasks"
        description="Follow-up tasks across all customers — complete them here or from a customer's page"
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="text-sm text-muted-foreground sm:mr-auto">
          {totalItems} task{totalItems === 1 ? "" : "s"}
        </p>
        <Button
          variant={overdueOnly ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setOverdueOnly(!overdueOnly);
            setCurrentPage(1);
          }}
        >
          <AlertTriangle className="h-4 w-4 mr-1" />
          Overdue only
        </Button>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingIndicator message="Loading tasks..." />
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-10 text-center">
          <CalendarClock className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No tasks found</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Add tasks from a customer&apos;s detail page to follow up later.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-180 [&_td]:py-4 [&_th]:pb-3 [&_th]:pt-0">
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => {
                const isOverdue =
                  task.status === "open" &&
                  task.dueDate !== null &&
                  new Date(task.dueDate) < new Date();
                const isBusy = busyTaskId === task.id;
                return (
                  <TableRow key={task.id} className="hover:bg-muted/50">
                    <TableCell>
                      <span className="font-medium">{task.title}</span>
                      {task.description && (
                        <span className="block text-xs text-muted-foreground line-clamp-1 max-w-72">
                          {task.description}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/crm/customers/${task.userId}`}
                        className="font-medium hover:underline"
                      >
                        {task.user?.name ?? `#${task.userId}`}
                      </Link>
                      {task.user?.mobileNumber && (
                        <span className="block text-xs text-muted-foreground">
                          {task.user.mobileNumber}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {task.dueDate ? (
                        <span className={isOverdue ? "text-destructive" : ""}>
                          {formatDateTime(task.dueDate)}
                          {isOverdue && (
                            <span className="block text-xs">
                              overdue
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLES[task.status]}`}
                      >
                        {task.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(task.createdAt)}
                      {task.createdBy?.name && (
                        <span className="block text-xs">
                          by {task.createdBy.name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => handleToggleStatus(task)}
                      >
                        {isBusy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : task.status === "open" ? (
                          <>
                            <Check className="h-4 w-4 mr-1 text-green-600" />
                            Complete
                          </>
                        ) : (
                          <>
                            <RotateCcw className="h-4 w-4 mr-1 text-amber-600" />
                            Reopen
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && tasks.length > 0 && totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
          <div className="text-sm text-muted-foreground">
            Showing{" "}
            {((currentPage - 1) * PAGE_SIZE + 1).toLocaleString()} -{" "}
            {Math.min(currentPage * PAGE_SIZE, totalItems).toLocaleString()} of{" "}
            {totalItems.toLocaleString()} tasks
          </div>

          <PaginationComponent
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl="#"
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
