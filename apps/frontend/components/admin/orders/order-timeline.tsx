"use client";

import { Clock } from "lucide-react";
import { memo, useMemo } from "react";

import { Badge } from "@/components/ui/badge";

import { formatDateTime } from "@/lib/utils";
import { getStatusDotColor, getStatusIcon } from "@/utils/order-helper";
import { OrderStatus, type Order, type User } from "@/utils/types";


interface OrderTimelineProps {
  order: Order;
}

interface TimelineItemData {
  status: string;
  isActive: boolean;
  timestamp: string | null;
  note: string | null;
  updatedBy: {
    name: string;
  } | null;
}



const ORDER_FLOW = [
  OrderStatus.PENDING,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
] as const;

const CANCELLED_FLOW = [OrderStatus.PENDING, OrderStatus.CANCELLED] as const;



const getTimelineFlow = (currentStatus: string): readonly string[] => {
  const normalized = currentStatus.toLowerCase();
  if (normalized === OrderStatus.CANCELLED) return CANCELLED_FLOW;

  const index = ORDER_FLOW.indexOf(
    normalized as (typeof ORDER_FLOW)[number]
  );

  // Always render every step — upcoming ones show as hidden/inactive
  // (grayed node, no timestamp). Unknown statuses fall back to themselves.
  if (index >= 0) return ORDER_FLOW;
  return [normalized];
};

const isStatusActive = (status: string, currentStatus: string): boolean => {
  const s = status.toLowerCase();
  const c = currentStatus.toLowerCase();

  if (c === OrderStatus.CANCELLED) {
    return s === OrderStatus.PENDING || s === OrderStatus.CANCELLED;
  }

  const sIndex = ORDER_FLOW.indexOf(s as (typeof ORDER_FLOW)[number]);
  const cIndex = ORDER_FLOW.indexOf(c as (typeof ORDER_FLOW)[number]);

  return sIndex >= 0 && cIndex >= 0 && sIndex <= cIndex;
};

const formatStatusLabel = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1);

interface StepProps {
  item: TimelineItemData;
  isLast: boolean;
  currentStatus: string;
}

const NODE_SIZE = "size-8";

const StepComponent = memo<StepProps>(
  ({ item, isLast, currentStatus }) => {
    const isCurrent = item.status === currentStatus;
    const icon = getStatusIcon(item.status);

    return (
      <li className="relative flex flex-col items-center px-2 text-center">
        {/* Connector to the next node — spans from this node's edge into the
            next column so it visually bridges the gap between centers. */}
        {!isLast && (
          <span
            aria-hidden
            className={`absolute top-4 h-0.5 left-[calc(50%+1.25rem)] right-[calc(-50%+1.25rem)] ${
              item.isActive ? "bg-primary/40" : "bg-border"
            }`}
          />
        )}

        {/* Node */}
        <span
          className={`z-10 flex ${NODE_SIZE} items-center justify-center rounded-full border-4 border-background shadow-sm ${
            item.isActive
              ? getStatusDotColor(item.status)
              : "bg-muted"
          } ${isCurrent ? "ring-4 ring-primary/15" : ""}`}
        >
          {icon && (
            <span className={item.isActive ? "text-white" : "text-muted-foreground/60"}>
              {icon}
            </span>
          )}
        </span>

        {/* Label */}
        <div className="mt-2 flex items-center justify-center gap-1.5">
          <span
            className={`text-sm font-semibold ${
              item.isActive ? "" : "text-muted-foreground"
            }`}
          >
            {formatStatusLabel(item.status)}
          </span>
          {isCurrent && (
            <Badge
              className={`h-5 rounded-full border-0 px-2 text-[9px] font-semibold uppercase tracking-wider text-white ${getStatusDotColor(item.status)}`}
            >
              Current
            </Badge>
          )}
        </div>

        {/* Note */}
        {item.note && (
          <p className="mt-0.5 max-w-44 text-xs leading-snug text-muted-foreground">
            {item.note}
          </p>
        )}

        {/* Meta — only for steps that actually happened; hidden steps have
            no track row and would otherwise read a fabricated "System" */}
        {item.isActive && (
          <div className="mt-1 text-[11px] text-muted-foreground">
            Updated by {item.updatedBy?.name || "System"}
          </div>
        )}

        {/* Timestamp pill */}
        {item.timestamp && (
          <div className="mt-1.5 rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
            {formatDateTime(item.timestamp)}
          </div>
        )}
      </li>
    );
  }
);

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


export function OrderTimeline({ order }: OrderTimelineProps) {
  const statusTracksMap = useMemo(() => {
    const map = new Map<
      string,
      { createdAt: string; note: string | null; updatedBy: User }
    >();

    order.statusTracks?.forEach((track) => {
      map.set(track.status.toLowerCase(), track);
    });

    return map;
  }, [order.statusTracks]);

  const timelineFlow = useMemo(
    () => getTimelineFlow(order.orderStatus),
    [order.orderStatus]
  );

  const timelineItems = useMemo<TimelineItemData[]>(() => {
    return timelineFlow.map((status) => {
      const track = statusTracksMap.get(status.toLowerCase());

      return {
        status,
        isActive: isStatusActive(status, order.orderStatus),
        timestamp: track?.createdAt || null,
        note: track?.note || null,
        updatedBy: track?.updatedBy || null,
      };
    });
  }, [timelineFlow, statusTracksMap, order.orderStatus]);

  const hasData = order.statusTracks && order.statusTracks.length > 0;

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

      {/* Content — horizontal stepper, one column per status */}
      <div className="min-h-20 p-2">
        {hasData ? (
          <ol
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${timelineItems.length}, minmax(0, 1fr))`,
            }}
          >
            {timelineItems.map((item, index) => (
              <StepComponent
                key={item.status}
                item={item}
                isLast={index === timelineItems.length - 1}
                currentStatus={order.orderStatus}
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
