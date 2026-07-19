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
      <TimelineItem className="pb-0">
        <TimelineSeparator>
          <TimelineDot
            className={`${item.isActive ? getStatusDotColor(item.status) : "bg-muted"} ${
              isCurrent ? "ring-2 ring-primary/30" : ""
            }`}
          />
          {!isLast && (
            <TimelineConnector
              className={
                item.isActive
                  ? "bg-primary/40"
                  : "bg-border border-dashed"
              }
            />
          )}
        </TimelineSeparator>

        <TimelineContent>
          <div
            className={`ml-3 rounded-md px-3 py-2 ${
              isCurrent
                ? "bg-primary/5 border border-primary/20"
                : "bg-muted/20"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {icon && <span className="text-primary">{icon}</span>}
                <span className="text-sm font-medium">
                  {formatStatusLabel(item.status)}
                </span>
                {isCurrent && (
                  <Badge
                    variant="default"
                    className="h-4 px-1.5 text-[9px]"
                  >
                    Current
                  </Badge>
                )}
              </div>

              {item.timestamp && (
                <time className="text-[11px] text-muted-foreground">
                  {formatDateTime(item.timestamp)}
                </time>
              )}
            </div>

            {/* Note */}
            {item.note && (
              <p className="mt-1 text-xs text-muted-foreground leading-snug">
                {item.note}
              </p>
            )}

            {/* Meta */}
            <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
            
              <span>
                {item.updatedBy?.name || "System"}
              </span>
            </div>
          </div>
        </TimelineContent>
      </TimelineItem>
    );
  }
);

TimelineItemComponent.displayName = "TimelineItemComponent";



const EmptyTimelineState = () => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <Clock className="h-8 w-8 text-muted-foreground/40 mb-2" />
    <p className="text-xs text-muted-foreground">
      No status updates yet
    </p>
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
    <section className="rounded-lg border bg-card p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold flex items-center gap-4">
          <Clock className="h-4 w-4 text-primary" />
          Order Timeline
        </h3>

        {hasData && (
          <Badge variant="outline" className="text-[10px] h-5">
            {timelineItems.length}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="min-h-[120px]">
        {hasData ? (
          <Timeline>
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
