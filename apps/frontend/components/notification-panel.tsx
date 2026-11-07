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
  Copy,
  CreditCard,
  Hash,
  Mail,
  Megaphone,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/**
 * Per-event visual identity: a matching colored icon tile. Row surfaces stay
 * solid (`bg-card`) per the notification styling convention — unread is
 * signalled by the colored tile + bold title, never a row tint.
 */
const EVENT_META = {
  newOrder: {
    label: "New Order",
    tile: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    Icon: Bell,
  },
  orderConfirmation: {
    label: "Order Confirmed",
    tile: "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400",
    Icon: CheckCircle2,
  },
  orderStatusUpdate: {
    label: "Order Status Update",
    tile: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    Icon: Truck,
  },
  paymentStatusUpdate: {
    label: "Payment Update",
    tile:
      "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
    Icon: CreditCard,
  },
  newMessage: {
    label: "New Message",
    tile: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400",
    Icon: Mail,
  },
  broadcast: {
    label: "System Notification",
    tile:
      "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
    Icon: Megaphone,
  },
  notification: {
    label: "Notification",
    tile: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
    Icon: Bell,
  },
} as const;

const DEFAULT_META = EVENT_META.notification;

function getEventMeta(event: string) {
  return EVENT_META[event as keyof typeof EVENT_META] ?? DEFAULT_META;
}

export function NotificationPanel() {
  const {
    notifications,
    isConnected,
    clearNotifications,
    removeNotification,
    markNotificationRead,
  } = useNotification();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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
    <Card className="mx-auto flex min-h-0 w-full flex-1 flex-col gap-0 border-0 bg-card py-0 shadow-lg">
      <CardHeader className="shrink-0 space-y-0 border-b px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <span className="rounded-xl bg-red-50 p-2 dark:bg-red-950/40">
              <Bell className="h-5 w-5 text-red-500" />
            </span>
            <span>Notifications</span>
            {notifications.length > 0 && (
              <Badge
                variant="destructive"
                className="h-6 min-w-6 rounded-full px-1.5 text-xs"
              >
                {notifications.length > 99 ? "99+" : notifications.length}
              </Badge>
            )}
          </CardTitle>

          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium sm:px-3 sm:py-1.5 sm:text-sm",
                isConnected
                  ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                  : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
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
                className="h-9 w-9 rounded-xl p-0"
                aria-label="Clear all notifications"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 p-0">
        <ScrollArea className="h-full">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <div className="mb-4 rounded-full bg-muted/50 p-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-1 text-sm font-semibold">
                No notifications yet
              </h3>
              <p className="max-w-xs text-xs text-muted-foreground">
                You&apos;ll be notified about order updates here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification, index) => {
                const meta = getEventMeta(notification.event);
                const Icon = meta.Icon;
                const isUnread = Boolean(notification.id) && !notification.isRead;
                const hasOrder = Boolean(
                  notification.data.orderNo && notification.data.orderId
                );
                // Always surface the dedicated order chip when an order exists:
                // on mobile the message is line-clamped, so relying on the number
                // inside the message text would hide it.
                const showOrderChip = hasOrder;
                const message = notification.data.message;
                const titleText = notification.data.title || meta.label;

                return (
                  <div
                    key={index}
                    onClick={() =>
                      notification.id &&
                      !notification.isRead &&
                      markNotificationRead(notification.id)
                    }
                    className={cn(
                      "group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40",
                      isUnread && "cursor-pointer"
                    )}
                  >
                    {/* Event icon — colored when unread, muted when read */}
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full",
                        isUnread
                          ? meta.tile
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="size-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Line 1: title + order chip + time */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <h4
                            title={titleText}
                            className={cn(
                              "truncate text-sm",
                              isUnread
                                ? "font-semibold text-foreground"
                                : "font-medium text-muted-foreground"
                            )}
                          >
                            {titleText}
                          </h4>

                          {showOrderChip && (
                            <div className="inline-flex shrink-0 items-center gap-1 rounded-md border bg-muted/40 px-1.5 py-0.5">
                              <Hash className="size-3 text-muted-foreground" />
                              <Link
                                href={`/admin/order/${notification.data.orderId}/view`}
                                className="text-xs font-semibold hover:underline"
                              >
                                {notification.data.orderNo}
                              </Link>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (notification.data.orderNo) {
                                    copyOrderNo(
                                      notification.data.orderNo,
                                      index
                                    );
                                  }
                                }}
                                className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                aria-label="Copy order number"
                              >
                                {copiedIndex === index ? (
                                  <Check className="size-3 text-green-500" />
                                ) : (
                                  <Copy className="size-3" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>

                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDistanceToNow(
                            new Date(notification.timestamp),
                            { addSuffix: true }
                          )}
                        </span>
                      </div>

                      {/* Line 2: message, max two lines */}
                      <p
                        title={message}
                        className="mt-0.5 line-clamp-2 text-xs text-muted-foreground"
                      >
                        {message}
                      </p>
                    </div>

                    {/* Dismiss */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(index);
                      }}
                      className="h-7 w-7 shrink-0 rounded-full bg-transparent p-0 text-muted-foreground hover:bg-destructive/15 hover:text-destructive md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:focus:opacity-100"
                      aria-label="Dismiss notification"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <div className="shrink-0 border-t p-2">
        <Button
          asChild
          variant="ghost"
          className="w-full text-sm font-medium text-primaryColor hover:text-primaryColor"
        >
          <Link href="/admin/inbox/notifications/notification-list">
            View all notifications
          </Link>
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
        connected ? "animate-pulse bg-green-500" : "bg-red-500"
      )}
    />
  );
}
