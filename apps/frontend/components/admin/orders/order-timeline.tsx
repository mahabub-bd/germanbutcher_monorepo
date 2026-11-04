"use client";

import { Clock } from "lucide-react";
import { memo, useMemo, type CSSProperties } from "react";

import { Badge } from "@/components/ui/badge";

import { formatDateTime } from "@/lib/utils";
import { getStatusDotColor, getStatusIcon } from "@/utils/order-helper";
import { type Order, type StatusTrack, type User } from "@/utils/types";

interface OrderTimelineProps {
  order: Order;
}

interface TimelineItemData {
  status: string;
  isCurrent: boolean;
  timestamp: string;
  note: string | null;
  updatedBy: {
    name: string;
  } | null;
}

const formatStatusLabel = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1);

const NODE_SIZE = "size-8";

const StepComponent = memo<StepProps>(
  ({ item, isLast }) => {
    const icon = getStatusIcon(item.status);

    return (
      <li className="relative flex items-start gap-3 px-2 py-1 sm:flex-col sm:items-center sm:gap-0 sm:py-0 sm:text-center">
        {/* Horizontal connector (sm+) — spans from this node's edge into the
            next column so it visually bridges the gap between centers. */}
        {!isLast && (
          <span
            aria-hidden
            className="absolute top-4 hidden h-0.5 left-[calc(50%+1.25rem)] right-[calc(-50%+1.25rem)] bg-primary/40 sm:block"
          />
        )}

        {/* Vertical connector (mobile) — runs from below this node down to
            the next item's node. */}
        {!isLast && (
          <span
            aria-hidden
            className="absolute top-9 bottom-0 left-6 w-0.5 -translate-x-1/2 bg-primary/40 sm:hidden"
          />
        )}

        {/* Node */}
        <span
          className={`z-10 flex shrink-0 ${NODE_SIZE} items-center justify-center rounded-full border-4 border-background shadow-sm ${getStatusDotColor(
            item.status
          )} ${item.isCurrent ? "ring-4 ring-primary/15" : ""}`}
        >
          {icon && <span className="text-white">{icon}</span>}
        </span>

        {/* Text column — inline (right of node) on mobile, below node on sm+ */}
        <div className="flex min-w-0 flex-col items-start sm:mt-2 sm:items-center">
          {/* Label */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold">
              {formatStatusLabel(item.status)}
            </span>
            {item.isCurrent && (
              <Badge
                className={`h-5 rounded-full border-0 px-2 text-[9px] font-semibold uppercase tracking-wider text-white ${getStatusDotColor(item.status)}`}
              >
                Current
              </Badge>
            )}
          </div>

          {/* Note */}
          {item.note && (
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              {item.note}
            </p>
          )}

          <div className="mt-1 text-[11px] text-muted-foreground">
            Updated by {item.updatedBy?.name || "System"}
          </div>

          {/* Timestamp pill */}
          <div className="mt-1.5 rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
            {formatDateTime(item.timestamp)}
          </div>
        </div>
      </li>
    );
  }
);

interface StepProps {
  item: TimelineItemData;
  isLast: boolean;
}

StepComponent.displayName = "StepComponent";

const EmptyTimelineState = () => (
  <div className="flex flex-col items-center justify-center rounded-sm border border-dashed py-7 text-center">
    <div className="mb-2 rounded-full bg-muted p-2">
      <Clock className="h-4 w-4 text-muted-foreground" />
    </div>
    <p className="text-sm font-medium text-foreground">
      No status updates yet
    </p>
    <p className="mt-1 text-xs text-muted-foreground">Updates will appear here as the order progresses.</p>
  </div>
);

/**
 * Sorts the real status history chronologically and keeps EVERY status the
 * order has been through (e.g. Pending → Processing → On Hold shows all
 * three instead of collapsing to a flow derived from the current status).
 */
export function OrderTimeline({ order }: OrderTimelineProps) {
  const timelineItems = useMemo<TimelineItemData[]>(() => {
    const tracks: StatusTrack[] = [...(order.statusTracks ?? [])].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const current = order.orderStatus?.toLowerCase();

    return tracks.map((track) => ({
      status: track.status,
      isCurrent:
        current != null && track.status.toLowerCase() === current,
      timestamp: track.createdAt,
      note: track.note || null,
      updatedBy: track.updatedBy as User | undefined ?? null,
    }));
  }, [order.statusTracks, order.orderStatus]);

  const hasData = timelineItems.length > 0;

  return (
    <section className="overflow-hidden rounded-sm border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b bg-linear-to-r from-primary/[0.07] via-primary/2 to-transparent px-4 py-2.5">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <span className="rounded-md bg-primary/10 p-1 text-primary">
            <Clock className="h-3.5 w-3.5" />
          </span>
          Order Timeline
        </h3>

        {hasData && (
          <Badge variant="outline" className="h-6 rounded-full px-2.5 text-[10px] font-medium">
            {timelineItems.length} steps
          </Badge>
        )}
      </div>

      {/* Content — vertical list on mobile, horizontal stepper (one column
          per status) from sm up */}
      <div className="min-h-20 p-2">
        {hasData ? (
          <ol
            className="flex flex-col gap-1 sm:grid sm:gap-0 sm:grid-cols-[repeat(var(--steps),minmax(0,1fr))]"
            style={{ "--steps": timelineItems.length } as CSSProperties}
          >
            {timelineItems.map((item, index) => (
              <StepComponent
                key={`${item.status}-${item.timestamp}-${index}`}
                item={item}
                isLast={index === timelineItems.length - 1}
              />
            ))}
          </ol>
        ) : (
          <EmptyTimelineState />
        )}
      </div>
    </section>
  );
}
