import { getUser } from "@/actions/auth";
import MySupport from "@/components/user-account/my-support";
import {
  fetchDataPagination,
  fetchProtectedData,
  postData,
} from "@/utils/api-utils";
import { serverRevalidate } from "@/utils/revalidatePath";
import { ContactMessage, Order, PaginatedEnvelope } from "@/utils/types";

export default async function SupportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page } = await searchParams;

  const handleSubmitMessage = async (payload: {
    name: string;
    email: string;
    mobile: string;
    message: string;
    orderReference?: string;
  }) => {
    "use server";
    if (payload.orderReference) {
      // Only accept a reference that points at one of the customer's own orders.
      const ownOrders: Order[] = await fetchProtectedData(
        `orders/user/${id}`
      );
      const isOwn = ownOrders.some(
        (order) => order.orderNo === payload.orderReference
      );
      if (!isOwn) {
        throw new Error("Invalid order reference");
      }
    }
    await postData("contact-messages", payload);
    serverRevalidate(`/user/${id}/support`);
  };

  try {
    const user = await getUser();
    const messagesData =
      await fetchDataPagination<PaginatedEnvelope<ContactMessage>>(
        `contact-messages/my?page=${page || 1}&limit=10`
      );
    // Non-fatal: a failure here just hides the order picker, not the page.
    let userOrders: Order[] = [];
    try {
      userOrders = await fetchProtectedData(`orders/user/${id}`);
    } catch (error) {
      console.error("Error fetching user orders for support form:", error);
    }

    return (
      <MySupport
        messagesData={messagesData}
        user={user}
        userId={id}
        currentPage={Number(page) || 1}
        orders={userOrders}
        onSubmitMessage={handleSubmitMessage}
      />
    );
  } catch (error) {
    console.error("Error fetching support messages:", error);
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            Unable to Load Support Messages
          </h1>
          <p className="mb-6 text-gray-600">
            There was an error loading your support messages. Please try again.
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
