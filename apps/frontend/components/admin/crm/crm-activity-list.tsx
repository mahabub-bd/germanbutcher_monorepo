"use client";

import { PaginationComponent } from "@/components/common/pagination";
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
import { fetchDataPagination } from "@/utils/api-utils";
import {
  CalendarClock,
  ListTodo,
  Mail,
  Phone,
  StickyNote,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

type ActivityType = "note" | "task" | "call" | "email";
type ActivityStatus = "open" | "completed";

interface ActivityItem {
  id: number;
  userId: number;
  user?: { id: number; name: string; mobileNumber: string | null } | null;
  type: ActivityType;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: ActivityStatus;
  completedAt: string | null;
  createdAt: string;
  createdBy?: { id: number; name: string } | null;
}

interface ListResponse {
  data: ActivityItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PAGE_SIZE = 10;

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "note", label: "Notes" },
  { value: "task", label: "Tasks" },
  { value: "call", label: "Calls" },
  { value: "email", label: "Emails" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "completed", label: "Completed" },
];

const TYPE_META: Record<ActivityType, { label: string; icon: typeof Mail }> = {
  note: { label: "Note", icon: StickyNote },
  task: { label: "Task", icon: ListTodo },
  call: { label: "Call", icon: Phone },
  email: { label: "Email", icon: Mail },
};

const TYPE_STYLES: Record<ActivityType, string> = {
  note: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  task: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  call: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  email: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
};

const STATUS_STYLES: Record<ActivityStatus, string> = {
  open: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  completed:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export function CrmActivityList() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE),
      });
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetchDataPagination<ListResponse>(
        `crm/activities?${params.toString()}`
      );
      setActivities(res.data);
      setTotalPages(res.totalPages ?? 1);
      setTotalItems(res.total ?? 0);
    } catch {
      toast.error("Failed to load activities.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, typeFilter, statusFilter]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const isOverdue = (activity: ActivityItem) =>
    activity.status === "open" &&
    activity.dueDate !== null &&
    new Date(activity.dueDate) < new Date();

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="CRM Activities"
        description="Every note, task, call and email log across all customers — newest first"
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="text-sm text-muted-foreground sm:mr-auto">
          {totalItems} activit{totalItems === 1 ? "y" : "ies"}
        </p>
        <Select
          value={typeFilter}
          onValueChange={(value) => {
            setTypeFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <LoadingIndicator message="Loading activities..." />
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-10 text-center">
          <CalendarClock className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No activities found</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Add notes, tasks and call logs from a customer&apos;s detail page.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-180 [&_td]:py-4 [&_th]:pb-3 [&_th]:pt-0">
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => {
                const meta = TYPE_META[activity.type] ?? TYPE_META.note;
                const TypeIcon = meta.icon;
                return (
                  <TableRow key={activity.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Link
                        href={`/admin/crm/customers/${activity.userId}`}
                        className="font-medium hover:underline"
                      >
                        {activity.user?.name ?? `#${activity.userId}`}
                      </Link>
                      {activity.user?.mobileNumber && (
                        <span className="block text-xs text-muted-foreground">
                          {activity.user.mobileNumber}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{activity.title}</span>
                      {activity.description && (
                        <span className="block text-xs text-muted-foreground line-clamp-1 max-w-72">
                          {activity.description}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${TYPE_STYLES[activity.type] ?? TYPE_STYLES.note}`}
                      >
                        <TypeIcon className="h-3 w-3" />
                        {meta.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLES[activity.status]}`}
                      >
                        {activity.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {activity.dueDate ? (
                        <span
                          className={
                            isOverdue(activity) ? "text-destructive" : ""
                          }
                        >
                          {formatDateTime(activity.dueDate)}
                          {isOverdue(activity) && " (overdue)"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(activity.createdAt)}
                      {activity.createdBy?.name && (
                        <span className="block text-xs">
                          by {activity.createdBy.name}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && activities.length > 0 && totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
          <div className="text-sm text-muted-foreground">
            Showing{" "}
            {((currentPage - 1) * PAGE_SIZE + 1).toLocaleString()} -{" "}
            {Math.min(currentPage * PAGE_SIZE, totalItems).toLocaleString()} of{" "}
            {totalItems.toLocaleString()} activities
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
