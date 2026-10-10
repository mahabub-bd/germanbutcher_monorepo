"use client";

import { Button } from "@/components/ui/button";
import { PaginationComponent } from "@/components/common/pagination";
import { formatDateTime } from "@/lib/utils";
import {
  PaginatedEnvelope,
  PersistedNotification,
} from "@/utils/types";
import {
  Bell,
  CheckCheck,
  CreditCard,
  Hash,
  Package,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface AdminNotificationsProps {
  notificationsData: PaginatedEnvelope<PersistedNotification>;
  currentPage: number;
  onMarkRead: (notificationId: number) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
}

const TYPE_ICONS: Record<string, typeof Bell> = {
  newOrder: Package,
  orderStatusUpdate: Package,
  paymentStatusUpdate: CreditCard,
  notification: Bell,
};

const getRelativeTime = (dateStr: string) => {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return formatDateTime(dateStr);
};

const AdminNotifications = ({
  notificationsData,
  currentPage,
  onMarkRead,
  onMarkAllRead,
}: AdminNotificationsProps) => {
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState<number | null>(null);

  const notifications = notificationsData?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkRead = async (id: number) => {
    setMarkingId(id);
    try {
      await onMarkRead(id);
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await onMarkAllRead();
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500">
            {unreadCount} unread on this page
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleMarkAllRead}
          disabled={markingAll || unreadCount === 0}
        >
          <CheckCheck className="mr-2 h-4 w-4" />
          Mark all read
        </Button>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <Bell className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            No notifications
          </h2>
          <p className="text-gray-600">
            New order alerts will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = TYPE_ICONS[notification.type] ?? Bell;
            const order = notification.data?.orderNo
              ? notification.data
              : null;

            return (
              <button
                key={notification.id}
                type="button"
                onClick={() =>
                  !notification.isRead && handleMarkRead(notification.id)
                }
                disabled={markingId === notification.id}
                className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                  notification.isRead
                    ? "border-gray-200 bg-white"
                    : "border-primaryColor/20 bg-red-50/50"
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    notification.isRead
                      ? "bg-gray-100 text-gray-500"
                      : "bg-red-50 text-primaryColor"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-semibold text-gray-900">
                      {notification.title}
                    </span>
                    {!notification.isRead && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full bg-primaryColor"
                        aria-label="Unread"
                      />
                    )}
                  </span>
                  <span className="mt-0.5 block text-sm text-gray-600">
                    {notification.message}
                  </span>
                  {order && (
                    <Link
                      href={`/admin/order/${order.orderId}/view`}
                      className="mt-1.5 inline-flex items-center gap-1 rounded-lg border bg-white px-1.5 py-1 text-xs font-semibold hover:underline"
                    >
                      <Hash className="h-3.5 w-3.5 text-blue-500" />
                      {order.orderNo}
                    </Link>
                  )}
                  <span className="mt-1 block text-xs text-gray-400">
                    {getRelativeTime(notification.createdAt)}
                  </span>
                </span>
              </button>
            );
          })}

          {notificationsData.totalPages > 1 && (
            <PaginationComponent
              currentPage={currentPage}
              totalPages={notificationsData.totalPages}
              baseUrl="?page="
            />
          )}
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
