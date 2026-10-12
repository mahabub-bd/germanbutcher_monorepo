import { formatDateTime } from "@/lib/utils";
import type { ProductReview } from "@/utils/types";
import { BadgeCheck } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { Stars } from "./stars";

interface ReviewItemProps {
  review: ProductReview;
  /** Optional footer content (e.g. an edit action on the user's own review). */
  action?: ReactNode;
}

/**
 * A single approved review in the storefront list — one line on desktop,
 * wrapping to two lines on mobile (comment drops below).
 */
export function ReviewItem({ review, action }: ReviewItemProps) {
  const reviewerName = review.user?.name || "Customer";

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-gray-100 pb-4 last:border-b-0">
      {/* Reviewer photo, falling back to an initial */}
      {review.user?.profilePhoto?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={review.user.profilePhoto.url}
          alt={`${reviewerName}'s avatar`}
          className="h-10 w-10 shrink-0 rounded-full border border-gray-100 object-contain bg-white"
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondaryColor to-primaryColor text-sm font-semibold text-white">
          {reviewerName.charAt(0).toUpperCase()}
        </div>
      )}

      <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 sm:w-40 sm:flex-none">
        {reviewerName}
      </span>

      <span className="hidden shrink-0 items-center gap-1 text-xs font-medium text-green-700 sm:flex">
        <BadgeCheck className="h-3.5 w-3.5" /> Verified Buyer
      </span>

      <Stars rating={review.rating} />

      {/* Comment line: text left, photo right — stays a single second row */}
      <span className="order-last flex w-full items-start gap-3 pl-[52px]">
        <span className="min-w-0 flex-1 text-sm text-gray-600">
          {review.title && (
            <span className="font-semibold text-gray-900">
              {review.title} —{" "}
            </span>
          )}
          {review.comment}
        </span>
        {review.attachment?.url && (
          <Image
            src={review.attachment.url}
            alt={`Photo from ${reviewerName}'s review`}
            width={80}
            height={80}
            className="h-20 w-20 shrink-0 rounded-lg border border-gray-100 object-contain bg-white"
          />
        )}
      </span>

      <span className="shrink-0 text-xs text-muted-foreground">
        {formatDateTime(review.createdAt)}
      </span>

      {action && <span className="flex shrink-0 items-center gap-2">{action}</span>}
    </div>
  );
}
