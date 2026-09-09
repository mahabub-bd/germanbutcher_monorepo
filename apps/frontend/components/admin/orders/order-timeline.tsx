"use client";

import { Clock } from "lucide-react";
import { memo, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
} from "@/components/ui/timeline";

import { formatDateTime } from "@/lib/utils";
import { getStatusDotColor, getStatusIcon } from "@/utils/order-helper";
import { OrderStatus, type Order } from "@/utils/types";


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

  return index >= 0 ? ORDER_FLOW.slice(0, index + 1) : [normalized];
};

const isStatusActive = (status: string, currentStatus: string): boolean => {
  const s = status.toLowerCase();
  const c = currentStatus.toLowerCase();

  if (c === OrderStatus.CANCELLED) {
    return s === OrderStatus.PENDING || s === OrderStatus.CANCELLED;
  }

  const sIndex = ORDER_FLOW.indexOf(s as any);
  const cIndex = ORDER_FLOW.indexOf(c as any);

  return sIndex >= 0 && cIndex >= 0 && sIndex <= cIndex;
};

const formatStatusLabel = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1);

interface TimelineItemProps {
  item: TimelineItemData;
  isLast: boolean;
  currentStatus: string;
}

const TimelineItemComponent = memo<TimelineItemProps>(
  ({ item, isLast, currentStatus }) => {
    const isCurrent = item.status === currentStatus;
    const icon = item.isActive ? getStatusIcon(item.status) : null;

    return (
      <TimelineItem className="pb-0 last:pb-0">
        <TimelineSeparator className="w-8 shrink-0">
          <TimelineDot
            className={`flex h-7 w-7 items-center justify-center border-4 border-background shadow-sm ${item.isActive ? getStatusDotColor(item.status) : "bg-muted"} ${
              isCurrent ? "ring-4 ring-primary/15" : ""
            }`}
          >
            {icon && <span className="scale-75 text-white">{icon}</span>}
          </TimelineDot>
          {!isLast && (
            <TimelineConnector
              className={
                item.isActive
                  ? "my-1.5 bg-primary/30"
                  : "my-1.5 border-l border-dashed border-border bg-transparent"
              }
            />
          )}
        </TimelineSeparator>

        <TimelineContent>
          <div
            className={`ml-1.5 rounded-lg border px-3 py-2.5 transition-colors ${
              isCurrent
                ? "border-primary/25 bg-primary/[0.045] shadow-sm"
                : item.isActive
                  ? "border-border/70 bg-card"
                  : "border-transparent bg-muted/30 opacity-70"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-sm font-semibold">
                  {formatStatusLabel(item.status)}
                </span>
                {isCurrent && (
                  <Badge
                    variant="default"
                    className="h-5 rounded-full px-2 text-[9px] font-semibold uppercase tracking-wider"
                  >
                    Current
                  </Badge>
                )}
              </div>

              {item.timestamp && (
                <time className="shrink-0 text-[11px] text-muted-foreground">
                  {formatDateTime(item.timestamp)}
                </time>
              )}
            </div>

            {/* Note */}
            {item.note && (
              <p className="mt-1.5 border-l-2 border-primary/20 pl-2 text-xs leading-snug text-muted-foreground">
                {item.note}
              </p>
            )}

            {/* Meta */}
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/45" />
              <span>Updated by {item.updatedBy?.name || "System"}</span>
            </div>
          </div>
        </TimelineContent>
      </TimelineItem>
    );
  }
);

TimelineItemComponent.displayName = "TimelineItemComponent";



const EmptyTimelineState = () => (
  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-7 text-center">
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
      { createdAt: string; note: string | null; updatedBy: any }
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
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-gradient-to-r from-primary/[0.07] via-primary/[0.02] to-transparent px-4 py-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <span className="rounded-md bg-primary/10 p-1 text-primary">
              <Clock className="h-3.5 w-3.5" />
            </span>
          Order Timeline
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">Track each stage of this order.</p>
        </div>

        {hasData && (
          <Badge variant="outline" className="h-6 rounded-full px-2.5 text-[10px] font-medium">
            {timelineItems.length} steps
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="min-h-[110px] p-4">
        {hasData ? (
          <Timeline className="space-y-2">
            {timelineItems.map((item, index) => (
              <TimelineItemComponent
                key={item.status}
                item={item}
                isLast={index === timelineItems.length - 1}
                currentStatus={order.orderStatus}
              />
            ))}
          </Timeline>
        ) : (
          <EmptyTimelineState />
        )}
      </div>
    </section>
  );
}
