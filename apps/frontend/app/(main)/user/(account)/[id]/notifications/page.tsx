import MyNotifications from "@/components/user-account/my-notifications";
import { fetchDataPagination, patchData } from "@/utils/api-utils";
import { serverRevalidate } from "@/utils/revalidatePath";
import {
  PaginatedEnvelope,
  PersistedNotification,
} from "@/utils/types";

export default async function NotificationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page } = await searchParams;

  const handleMarkRead = async (notificationId: number) => {
    "use server";
    await patchData(`notifications/${notificationId}/read`);
    serverRevalidate(`/user/${id}/notifications`);
  };

  const handleMarkAllRead = async () => {
    "use server";
    await patchData(`notifications/read-all`);
    serverRevalidate(`/user/${id}/notifications`);
  };

  try {
    const notificationsData =
      await fetchDataPagination<PaginatedEnvelope<PersistedNotification>>(
        `notifications/my?page=${page || 1}&limit=15`
      );

    return (
      <MyNotifications
        notificationsData={notificationsData}
        userId={id}
        currentPage={Number(page) || 1}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
      />
    );
  } catch (error) {
    console.error("Error fetching notifications:", error);
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
            href=""
            className="rounded-lg bg-primaryColor px-6 py-3 text-white transition-colors hover:bg-primaryColor/90"
          >
            Retry
          </a>
        </div>
      </div>
    );
  }
}
