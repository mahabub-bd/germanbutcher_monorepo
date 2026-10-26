"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { fetchDataPagination } from "@/utils/api-utils";
import {
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  History,
  Loader2,
  Pencil,
  Power,
  RefreshCw,
  Trash2,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface ProductActivity {
  id: number;
  action: string;
  entityId: number;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  message: string;
  ipAddress: string | null;
  userType: string;
  status: string;
  createdAt: string;
  user?: { name?: string; email?: string } | null;
}

type EventKind =
  | "added"
  | "edited"
  | "activated"
  | "deactivated"
  | "deleted";

const KIND_META: Record<
  EventKind,
  { label: string; badgeClass: string; icon: React.ReactNode }
> = {
  added: {
    label: "Added",
    badgeClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    icon: <CirclePlus className="h-3 w-3" />,
  },
  edited: {
    label: "Edited",
    badgeClass:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
    icon: <Pencil className="h-3 w-3" />,
  },
  activated: {
    label: "Activated",
    badgeClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    icon: <Power className="h-3 w-3" />,
  },
  deactivated: {
    label: "Deactivated",
    badgeClass:
      "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
    icon: <Power className="h-3 w-3" />,
  },
  deleted: {
    label: "Deleted",
    badgeClass:
      "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
    icon: <Trash2 className="h-3 w-3" />,
  },
};

function getEventKind(activity: ProductActivity): EventKind {
  if (activity.action.startsWith("DELETE")) return "deleted";
  if (activity.action.startsWith("POST")) return "added";
  const newValue = activity.newValue ?? {};
  if (typeof newValue.isActive === "boolean") {
    return newValue.isActive ? "activated" : "deactivated";
  }
  return "edited";
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function formatStatusValue(key: string, value: unknown): string {
  if (key === "isActive") return value ? "Active" : "Inactive";
  return formatValue(value);
}

/** Fields that changed between oldValue and newValue, with from -> to. */
function getChanges(activity: ProductActivity) {
  const oldValue = activity.oldValue;
  const newValue = activity.newValue;
  if (!oldValue || !newValue) return [];
  return Object.keys(newValue)
    .filter((key) => key in oldValue)
    .filter(
      (key) => JSON.stringify(newValue[key]) !== JSON.stringify(oldValue[key]),
    )
    .map((key) => ({
      key,
      from: formatStatusValue(key, oldValue[key]),
      to: formatStatusValue(key, newValue[key]),
    }));
}

function ActivityEntry({ activity }: { activity: ProductActivity }) {
  const kind = getEventKind(activity);
  const meta = KIND_META[kind];
  const changes = getChanges(activity);

  return (
    <li className="relative pl-10 pb-6 last:pb-0">
      {/* Timeline line + dot */}
      <span className="absolute left-[15px] top-6 bottom-0 w-px bg-border last:hidden" />
      <span className="absolute left-2 top-1 flex size-7 items-center justify-center rounded-full border bg-muted">
        <History className="size-3.5 text-muted-foreground" />
      </span>

      <div className="flex flex-wrap items-center gap-2">
        <Badge className={`gap-1 border-0 ${meta.badgeClass}`}>
          {meta.icon}
          {meta.label}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {formatDateTime(activity.createdAt)}
        </span>
      </div>

      <p className="mt-1.5 text-sm">{activity.message}</p>

      {changes.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {changes.map((change) => (
            <span
              key={change.key}
              className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-0.5 text-xs"
            >
              <span className="text-muted-foreground">{change.key}:</span>
              <span className="text-red-600 dark:text-red-400 line-through">
                {change.from}
              </span>
              <span className="text-muted-foreground">to</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {change.to}
              </span>
            </span>
          ))}
        </div>
      )}

      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <User className="size-3" />
        {activity.user?.name || "Unknown User"}
        <span className="text-muted-foreground/50">&bull;</span>
        {activity.ipAddress || "unknown IP"}
      </div>
    </li>
  );
}

interface ProductActivityHistoryProps {
  /** When set, shows history of this one product only; otherwise all products. */
  productId?: number;
}

export default function ProductActivityHistory({
  productId,
}: ProductActivityHistoryProps) {
  const [activities, setActivities] = useState<ProductActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const PAGE_SIZE = 15;

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      if (productId) {
        const response = await fetchDataPagination<{
          data: ProductActivity[];
        }>(`products/${productId}/history`);
        setActivities(response.data ?? []);
      } else {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: PAGE_SIZE.toString(),
        });
        const response = await fetchDataPagination<{
          data: ProductActivity[];
          total: number;
          totalPages: number;
        }>(`products/history?${params.toString()}`);
        setActivities(response.data ?? []);
        setTotalItems(response.total ?? 0);
        setTotalPages(response.totalPages ?? 1);
      }
    } catch (error) {
      console.error("Error fetching product history:", error);
      toast.error("Failed to load product history.");
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, [productId, currentPage]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="space-y-4">
      {!productId && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {totalItems} history {totalItems === 1 ? "event" : "events"} across
            all products
          </p>
          <Button variant="outline" size="sm" onClick={fetchHistory}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed rounded-xl p-10 text-center">
          <History className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            No history recorded yet.
          </p>
        </div>
      ) : (
        <ul className="mt-2">
          {activities.map((activity) => (
            <ActivityEntry key={activity.id} activity={activity} />
          ))}
        </ul>
      )}

      {!productId && totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((page) => page - 1)}
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((page) => page + 1)}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
