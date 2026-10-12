"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotification } from "@/hooks/use-notification";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import {
  Bell,
  Check,
  Clock,
  Copy,
  Hash,
  Trash2,
  X
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/** Per-event accent colors for the unread dot. */
const ACCENTS = {
  newOrder: {
    dot: "bg-blue-500",
  },
  orderConfirmation: {
    dot: "bg-green-500",
  },
  orderStatusUpdate: {
    dot: "bg-amber-500",
  },
  paymentStatusUpdate: {
    dot: "bg-purple-500",
  },
} as const;

const DEFAULT_ACCENT = {
  dot: "bg-gray-500",
};

export function NotificationPanel() {
  const {
    notifications,
    isConnected,
    clearNotifications,
    removeNotification,
    markNotificationRead,
  } = useNotification();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const getNotificationTitle = (event: string) => {
    switch (event) {
      case "newOrder":
        return "New Order";
      case "orderConfirmation":
        return "Order Confirmed";
      case "orderStatusUpdate":
        return "Order Status Update";
      case "paymentStatusUpdate":
        return "Payment Update";
      case "notification":
        return "Notification";
      case "broadcast":
        return "System Notification";
      default:
        return "Notification";
    }
  };

  const copyOrderNo = async (orderNo: string, index: number) => {
    try {
      await navigator.clipboard.writeText(orderNo);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      // clipboard unavailable (permissions/insecure context) — ignore
    }
  };

  return (
    <Card className="w-full h-full flex flex-col shadow-lg border-0 mx-auto">
      <CardHeader className="px-4 py-3 space-y-0 flex-shrink-0 border-b">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <span className="rounded-xl bg-red-50 dark:bg-red-950/40 p-2">
              <Bell className="h-5 w-5 text-red-500" />
            </span>
            <span>Notifications</span>
            {notifications.length > 0 && (
              <Badge
                variant="destructive"
                className="h-6 min-w-6 px-1.5 rounded-full text-xs"
              >
                {notifications.length > 99 ? "99+" : notifications.length}
              </Badge>
            )}
          </CardTitle>

          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium",
                isConnected
                  ? "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400"
                  : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400"
              )}
            >
              <CircleDot connected={isConnected} />
              {isConnected ? "Online" : "Offline"}
            </div>

            {notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearNotifications}
                className="h-9 w-9 p-0 rounded-xl"
                aria-label="Clear all notifications"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 min-h-0">
        <ScrollArea className="h-full">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="rounded-full bg-muted/50 p-4 mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-sm mb-1">
                No notifications yet
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                You'll be notified about order updates here
              </p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {notifications.map((notification, index) => {
                const accent =
                  ACCENTS[notification.event as keyof typeof ACCENTS] ??
                  DEFAULT_ACCENT;
                const hasOrder = Boolean(
                  notification.data.orderNo && notification.data.orderId
                );

                return (
                  <div
                    key={index}
                    onClick={() =>
                      notification.id &&
                      !notification.isRead &&
                      markNotificationRead(notification.id)
                    }
                    className={cn(
                      "flex items-stretch overflow-hidden rounded-xl border bg-blue-50/40 dark:bg-blue-950/10 border-blue-200/70 dark:border-blue-900/50 transition-all hover:shadow-md",
                      notification.id && !notification.isRead && "cursor-pointer"
                    )}
                  >
                    {/* Two lines everywhere. Mobile grid: title + dismiss on
                        row 1, chip/price/time on row 2. Desktop: one flex row. */}
                    <div
                      title={notification.data.message}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-1.5 p-2.5 sm:flex sm:items-center sm:gap-3 sm:p-3 min-w-0"
                    >
                      {/* Title (line 1, mobile) */}
                      <div className="col-start-1 row-start-1 min-w-0 sm:flex sm:flex-1 sm:items-center sm:gap-3">
                        <h4 className="flex items-center gap-1.5 font-bold text-sm leading-tight">
                          {notification.id && !notification.isRead && (
                            <span
                              className={cn(
                                "h-2 w-2 shrink-0 rounded-full",
                                accent.dot
                              )}
                            />
                          )}
                          <span className="truncate">
                            {notification.data.title ||
                              getNotificationTitle(notification.event)}
                          </span>
                        </h4>
                      </div>

                      {/* Order chip + price + time (line 2 mobile, inline
                          desktop). Chip only when the message doesn't already
                          carry the orderNo. */}
                      <div className="col-start-1 row-start-2 flex items-center gap-2 sm:gap-2.5 sm:order-2 sm:shrink-0 min-w-0">
                        {hasOrder &&
                          !notification.data.message?.includes(
                            notification.data.orderNo ?? ""
                          ) && (
                            <div className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white/80 dark:bg-background/60 border px-1.5 py-1">
                              <Hash className="h-3.5 w-3.5 text-blue-500" />
                              <Link
                                href={`/admin/order/${notification.data.orderId}/view`}
                                className="text-xs font-semibold hover:underline"
                              >
                                {notification.data.orderNo}
                              </Link>
                              <button
                                type="button"
                                onClick={() => {
                                  if (notification.data.orderNo) {
                                    copyOrderNo(notification.data.orderNo, index);
                                  }
                                }}
                                className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Copy order number"
                              >
                                {copiedIndex === index ? (
                                  <Check className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          )}

                        {notification.data.totalValue !== undefined && (
                          <span className="rounded-lg bg-red-100 dark:bg-red-950/40 px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs sm:text-sm font-bold text-red-600 dark:text-red-400">
                            ৳{notification.data.totalValue.toLocaleString()}
                          </span>
                        )}

                        <div className="w-px h-6 bg-border hidden sm:block" />

                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap truncate min-w-0">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          {formatDistanceToNow(
                            new Date(notification.timestamp),
                            { addSuffix: true }
                          )}
                        </span>
                      </div>

                      {/* Dismiss — right column on mobile, last on desktop */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(index);
                        }}
                        className="col-start-2 row-start-1 justify-self-end h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-full bg-muted/60 hover:bg-destructive/20 flex-shrink-0 sm:order-3"
                        aria-label="Dismiss notification"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <div className="flex-shrink-0 border-t p-2">
        <Button
          asChild
          variant="ghost"
          className="w-full text-sm font-medium text-primaryColor hover:text-primaryColor"
        >
          <Link href="/admin/notifications">View all notifications</Link>
        </Button>
      </div>
    </Card>
  );
}

function CircleDot({ connected }: { connected: boolean }) {
  return (
    <span
      className={cn(
        "h-2 w-2 rounded-full fill-current",
        connected ? "bg-green-500 animate-pulse" : "bg-red-500"
      )}
    />
  );
}
