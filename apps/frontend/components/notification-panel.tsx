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
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Hash,
  Info,
  Package,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

/** Per-event accent colors: icon tile and unread dot share the hue. */
const ACCENTS = {
  newOrder: {
    tile: "bg-blue-100 dark:bg-blue-950/40",
    dot: "bg-blue-500",
  },
  orderConfirmation: {
    tile: "bg-green-100 dark:bg-green-950/40",
    dot: "bg-green-500",
  },
  orderStatusUpdate: {
    tile: "bg-amber-100 dark:bg-amber-950/40",
    dot: "bg-amber-500",
  },
  paymentStatusUpdate: {
    tile: "bg-purple-100 dark:bg-purple-950/40",
    dot: "bg-purple-500",
  },
} as const;

const DEFAULT_ACCENT = {
  tile: "bg-gray-100 dark:bg-gray-950/40",
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

  const getNotificationIcon = (event: string) => {
    switch (event) {
      case "newOrder":
        return <Package className="h-6 w-6 text-blue-500" />;
      case "orderConfirmation":
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case "orderStatusUpdate":
        return <Package className="h-6 w-6 text-amber-500" />;
      case "paymentStatusUpdate":
        return <CreditCard className="h-6 w-6 text-purple-500" />;
      case "notification":
      case "broadcast":
        return <Info className="h-6 w-6 text-cyan-500" />;
      default:
        return <Bell className="h-6 w-6 text-gray-500" />;
    }
  };

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
                    <div className="flex-1 flex flex-wrap items-center gap-2 sm:gap-3 p-2.5 sm:p-3 min-w-0">
                      {/* Icon tile with unread dot */}
                      <div className="relative flex-shrink-0">
                        <div
                          className={cn(
                            "rounded-xl p-2 sm:p-3 shadow-sm",
                            accent.tile
                          )}
                        >
                          {getNotificationIcon(notification.event)}
                        </div>
                        <span
                          className={cn(
                            "absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-background",
                            accent.dot
                          )}
                        />
                      </div>

                      {/* Title + order chip + message */}
                      <div className="flex-1 min-w-[180px] sm:min-w-0">
                        <h4 className="font-bold text-sm leading-tight mb-1 truncate">
                          {notification.data.title ||
                            getNotificationTitle(notification.event)}
                        </h4>

                        {/* Older rows already contain the orderNo in the
                            message — only add the chip when it's not
                            duplicated there. */}
                        {hasOrder &&
                          !notification.data.message?.includes(
                            notification.data.orderNo ?? ""
                          ) && (
                          <div className="inline-flex items-center gap-1 rounded-lg bg-white/80 dark:bg-background/60 border px-1.5 py-1">
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

                        {notification.data.message && (
                          <p className="text-xs text-muted-foreground line-clamp-1 break-words mt-1">
                            {notification.data.message}
                          </p>
                        )}
                      </div>

                      {/* Right meta: price, time, dismiss — wraps to its own
                          full-width row on mobile */}
                      <div className="w-full sm:w-auto flex items-center gap-2 sm:gap-2.5 flex-shrink-0 pl-12 sm:pl-0">
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

                        <div className="w-px h-6 bg-border hidden sm:block" />

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(index);
                          }}
                          className="ml-auto sm:ml-0 h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-full bg-muted/60 hover:bg-destructive/20 flex-shrink-0"
                          aria-label="Dismiss notification"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
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
