import { BadgeCheck } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { formatDateTime } from "@/lib/utils";
import type { ProductReview } from "@/utils/types";
import { Stars } from "./stars";

interface ReviewItemProps {
  review: ProductReview;
  /** Optional footer content (e.g. an edit action on the user's own review). */
  action?: ReactNode;
}

/** A single approved review in the storefront list. */
export function ReviewItem({ review, action }: ReviewItemProps) {
  const reviewerName = review.user?.name || "Customer";

  return (
    <div className="flex gap-4 rounded-xl border border-gray-100 bg-white p-4 md:p-5 shadow-sm">
      {/* Avatar with initial */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondaryColor to-primaryColor text-sm font-semibold text-white">
        {reviewerName.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-medium text-gray-900">{reviewerName}</span>
          <span className="flex items-center gap-1 text-xs font-medium text-green-700">
            <BadgeCheck className="h-3.5 w-3.5" /> Verified Buyer
          </span>
          <span className="ml-auto text-xs text-muted-foreground">
            {formatDateTime(review.createdAt)}
          </span>
        </div>

        <div className="mt-1.5 flex items-center gap-2">
          <Stars rating={review.rating} />
          {review.title && (
            <h4 className="text-sm font-semibold text-gray-900">
              {review.title}
            </h4>
          )}
        </div>

        <div className="mt-1.5 flex items-start gap-4">
          <p className="min-w-0 flex-1 line-clamp-2 text-sm leading-relaxed text-gray-600">
            {review.comment}
          </p>

          {review.attachment?.url && (
            <Image
              src={review.attachment.url}
              alt={`Photo from ${reviewerName}'s review`}
              width={80}
              height={80}
              className="h-20 w-20 shrink-0 rounded-lg border border-gray-100 object-cover"
            />
          )}
        </div>

        {action && (
          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
