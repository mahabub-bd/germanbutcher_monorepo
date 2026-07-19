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
  CheckCircle2,
  Circle,
  CreditCard,
  ExternalLink,
  Info,
  Package,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";

export function NotificationPanel() {
  const { notifications, isConnected, clearNotifications, removeNotification } =
    useNotification();

  const getNotificationIcon = (event: string) => {
    const iconClass = "h-4 w-4";
    switch (event) {
      case "newOrder":
        return <Package className={cn(iconClass, "text-blue-500")} />;
      case "orderConfirmation":
        return <CheckCircle2 className={cn(iconClass, "text-green-500")} />;
      case "orderStatusUpdate":
        return <Package className={cn(iconClass, "text-amber-500")} />;
      case "paymentStatusUpdate":
        return <CreditCard className={cn(iconClass, "text-purple-500")} />;
      case "notification":
      case "broadcast":
        return <Info className={cn(iconClass, "text-cyan-500")} />;
      default:
        return <Bell className={cn(iconClass, "text-gray-500")} />;
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

  const getNotificationColor = (event: string) => {
    switch (event) {
      case "newOrder":
        return "bg-blue-50/50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-950/20";
      case "orderConfirmation":
        return "bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-900/50 hover:bg-green-50 dark:hover:bg-green-950/20";
      case "orderStatusUpdate":
        return "bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-950/20";
      case "paymentStatusUpdate":
        return "bg-purple-50/50 dark:bg-purple-950/10 border-purple-200 dark:border-purple-900/50 hover:bg-purple-50 dark:hover:bg-purple-950/20";
      default:
        return "bg-gray-50/50 dark:bg-gray-950/10 border-gray-200 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-950/20";
    }
  };

  return (
    <Card className="w-full h-full flex flex-col shadow-lg border-0 mx-auto">
      <CardHeader className="px-4 py-3 space-y-0 flex-shrink-0 border-b">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
            {notifications.length > 0 && (
              <Badge
                variant="destructive"
                className="h-5 min-w-5 px-1.5 text-xs"
              >
                {notifications.length > 99 ? "99+" : notifications.length}
              </Badge>
            )}
          </CardTitle>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary/50">
              <Circle
                className={cn(
                  "h-2 w-2 fill-current",
                  isConnected ? "text-green-500 animate-pulse" : "text-red-500"
                )}
              />
            </div>

            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearNotifications}
                className="h-7 px-2 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
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
            <div className="p-2 space-y-1.5">
              {notifications.map((notification, index) => (
                <Card
                  key={index}
                  className={cn(
                    "overflow-hidden transition-all hover:shadow-md border",
                    getNotificationColor(notification.event)
                  )}
                >
                  <CardContent className="p-2">
                    <div className="flex gap-2 items-center">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <div className="rounded-lg bg-background/80 p-1 shadow-sm">
                          {getNotificationIcon(notification.event)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* First Line: Title, Order Info, Timestamp */}
                        <div className="flex items-center gap-1.5 mb-1">
                          <h4 className="font-semibold text-xs leading-tight flex-1 truncate">
                            {notification.data.title ||
                              getNotificationTitle(notification.event)}
                          </h4>

                          {notification.data.totalValue && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-mono px-1.5 py-0 h-5"
                            >
                              ৳{notification.data.totalValue.toLocaleString()}
                            </Badge>
                          )}

                          {notification.data.orderNo && (
                            <Link
                              href={`/admin/order/${notification.data.orderId}/view`}
                              className="flex-shrink-0"
                            >
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 h-5 hover:bg-accent cursor-pointer gap-0.5"
                              >
                                #{notification.data.orderNo}
                                <ExternalLink className="h-3 w-3" />
                              </Badge>
                            </Link>
                          )}

                          <p className="text-[10px] text-muted-foreground flex-shrink-0">
                            {formatDistanceToNow(
                              new Date(notification.timestamp),
                              {
                                addSuffix: true,
                              }
                            )}
                          </p>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNotification(index)}
                            className="h-5 w-5 p-0 hover:bg-destructive/20 flex-shrink-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Second Line: Message */}
                        <p className="text-xs text-muted-foreground line-clamp-1 break-words">
                          {notification.data.message ||
                            `Order ${notification.data.orderNo || "N/A"}`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
