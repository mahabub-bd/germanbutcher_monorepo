import { fetchData } from "@/utils/api-utils";
import type {
  Product,
  ProductReview,
  RatingSummary,
  User,
} from "@/utils/types";
import { RatingSummary as RatingSummaryCard } from "./rating-summary";
import { ReviewForm } from "./review-form";
import { ReviewItem } from "./review-item";

interface ProductReviewsProps {
  product: Product;
  user: User | null;
}

/**
 * Storefront reviews section: rating summary + approved reviews + review form.
 * Server component; review data is cached for 60s by fetchData's non-product
 * endpoint policy.
 */
export async function ProductReviews({ product, user }: ProductReviewsProps) {
  const [summary, reviews] = await Promise.all([
    fetchData<RatingSummary>(
      `reviews/product/${product.id}/rating-summary`
    ),
    fetchData<ProductReview[]>(
      `reviews/product/${product.id}?page=1&limit=10`
    ),
  ]);

  const reviewList = (reviews ?? []).filter(
    // The signed-in customer's own review renders separately as their
    // "Your review" card — keep it out of the public list to avoid duplicates.
    (review) => !user?.id || review.user?.id !== user.id
  );

  // Hide the section while there is nothing to show and nobody can submit.
  // The form itself handles the eligibility states for signed-in users.
  const showSection = (summary && summary.reviewCount > 0) || user;

  if (!showSection) {
    return null;
  }

  return (
    <section className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 md:p-0 space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-gray-900">Customer Reviews</h2>
        {summary && summary.reviewCount > 0 && (
          <span className="rounded-full bg-primaryColor/10 px-2.5 py-0.5 text-xs font-semibold text-primaryColor">
            {summary.reviewCount}
          </span>
        )}
      </div>

      {summary && summary.reviewCount > 0 && (
        <>
          <RatingSummaryCard summary={summary} />
          <div className="space-y-3">
            {reviewList.map((review) => (
              <ReviewItem key={review.id} review={review} />
            ))}
          </div>
        </>
      )}

      <ReviewForm product={product} user={user} />
    </section>
  );
}
