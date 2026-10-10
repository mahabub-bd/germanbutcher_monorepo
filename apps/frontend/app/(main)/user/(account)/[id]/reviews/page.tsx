import MyReviews from "@/components/user-account/my-reviews";
import { fetchDataPagination, patchData } from "@/utils/api-utils";
import { serverRevalidate } from "@/utils/revalidatePath";
import {
  PaginatedEnvelope,
  ProductReview,
} from "@/utils/types";

export default async function MyReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page } = await searchParams;

  const handleEditReview = async (
    reviewId: number,
    payload: {
      rating: number;
      title?: string;
      comment: string;
      attachmentId?: string | null;
    }
  ) => {
    "use server";
    await patchData(`reviews/${reviewId}`, payload);
    serverRevalidate(`/user/${id}/reviews`);
  };

  try {
    const reviewsData = await fetchDataPagination<PaginatedEnvelope<ProductReview>>(
      `reviews/my?page=${page || 1}&limit=10`
    );

    return (
      <MyReviews
        reviewsData={reviewsData}
        userId={id}
        currentPage={Number(page) || 1}
        onEditReview={handleEditReview}
      />
    );
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Unable to Load Reviews
          </h1>
          <p className="text-gray-600 mb-6">
            There was an error loading your reviews. Please try again.
          </p>
          <a
            href=""
            className="bg-primaryColor text-white px-6 py-3 rounded-lg hover:bg-primaryColor/90 transition-colors"
          >
            Retry
          </a>
        </div>
      </div>
    );
  }
}
