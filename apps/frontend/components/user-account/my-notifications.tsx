"use client";

import { AccountPageHeader } from "@/components/user-account/account-page-header";
import { Button } from "@/components/ui/button";
import { PaginationComponent } from "@/components/common/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import {
  PaginatedEnvelope,
  PersistedNotification,
} from "@/utils/types";
import {
  Bell,
  CreditCard,
  Megaphone,
  Package,
} from "lucide-react";
import { useState } from "react";

interface MyNotificationsProps {
  notificationsData: PaginatedEnvelope<PersistedNotification>;
  userId: string;
  currentPage: number;
  onMarkRead: (notificationId: number) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
}

const TYPE_ICONS: Record<string, typeof Bell> = {
  orderConfirmation: Package,
  orderStatusUpdate: Package,
  paymentStatusUpdate: CreditCard,
  broadcast: Megaphone,
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

const MyNotifications = ({
  notificationsData,
  currentPage,
  onMarkRead,
  onMarkAllRead,
}: MyNotificationsProps) => {
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
      <AccountPageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread`}
        action={
          <Button
            variant="outline"
            onClick={handleMarkAllRead}
            disabled={markingAll || unreadCount === 0}
          >
            Mark all read
          </Button>
        }
      />

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <Bell className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            No notifications
          </h2>
          <p className="text-gray-600">
            Order updates and announcements will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <Table className="min-w-200 [&_td]:py-3 [&_th]:pb-3 [&_th]:pt-3">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Type</TableHead>
                  <TableHead>Notification</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification) => {
                  const Icon = TYPE_ICONS[notification.type] ?? Bell;
                  const isUnread = !notification.isRead;
                  return (
                    <TableRow
                      key={notification.id}
                      onClick={() =>
                        isUnread &&
                        markingId !== notification.id &&
                        handleMarkRead(notification.id)
                      }
                      className={
                        isUnread
                          ? "cursor-pointer bg-red-50/50 hover:bg-red-50"
                          : "cursor-pointer hover:bg-gray-50"
                      }
                    >
                      <TableCell>
                        <span
                          className={`flex h-9 w-9 items-center justify-center rounded-full ${
                            isUnread
                              ? "bg-red-50 text-primaryColor"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <Icon className="h-4.5 w-4.5" />
                        </span>
                      </TableCell>
                      <TableCell className="max-w-100">
                        <p className="flex items-center gap-2 font-semibold text-gray-900">
                          <span className="truncate">{notification.title}</span>
                          {isUnread && (
                            <span
                              className="h-2 w-2 shrink-0 rounded-full bg-primaryColor"
                              aria-label="Unread"
                            />
                          )}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            isUnread
                              ? "bg-red-50 text-primaryColor"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {isUnread ? "Unread" : "Read"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs text-gray-400 whitespace-nowrap">
                        {getRelativeTime(notification.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

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

export default MyNotifications;
