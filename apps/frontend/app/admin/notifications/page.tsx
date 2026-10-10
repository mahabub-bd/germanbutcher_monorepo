import AdminNotifications from "@/components/admin/notifications/admin-notifications";
import { fetchDataPagination, patchData } from "@/utils/api-utils";
import { serverRevalidate } from "@/utils/revalidatePath";
import {
  PaginatedEnvelope,
  PersistedNotification,
} from "@/utils/types";

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;

  const handleMarkRead = async (notificationId: number) => {
    "use server";
    await patchData(`notifications/admin/${notificationId}/read`);
    serverRevalidate("/admin/notifications");
  };

  const handleMarkAllRead = async () => {
    "use server";
    await patchData(`notifications/admin/read-all`);
    serverRevalidate("/admin/notifications");
  };

  try {
    const notificationsData =
      await fetchDataPagination<PaginatedEnvelope<PersistedNotification>>(
        `notifications/admin?page=${page || 1}&limit=15`
      );

    return (
      <div className="space-y-6 border rounded-sm p-4 md:p-6">
        <AdminNotifications
          notificationsData={notificationsData}
          currentPage={Number(page) || 1}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
        />
      </div>
    );
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            Unable to Load Notifications
          </h1>
          <p className="mb-6 text-gray-600">
            There was an error loading your notifications. Please try again.
          </p>
          <a
            href="/admin/notifications"
            className="rounded-lg bg-primaryColor px-6 py-3 text-white transition-colors hover:bg-primaryColor/90"
          >
            Retry
          </a>
        </div>
      </div>
    );
  }
}
