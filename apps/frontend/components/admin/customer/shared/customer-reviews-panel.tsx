"use client";

import { formatDateTime } from "@/lib/utils";

/** Product review line from the CRM 360 / users extras payload. */
export interface CustomerReviewRow {
    id: number;
    rating: number;
    title: string | null;
    comment: string;
    createdAt: string;
    product?: { id: number; name: string } | null;
}

/**
 * Reviews tab shared by the admin customer detail and CRM 360 pages:
 * one bordered card per review with star rating, title, product and date.
 */
export function CustomerReviewsPanel({ reviews }: { reviews: CustomerReviewRow[] }) {
    if (reviews.length === 0) {
        return (
            <p className="text-sm text-muted-foreground py-6 text-center">
                No reviews yet.
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {reviews.map((review) => (
                <div key={review.id} className="rounded-lg border bg-card p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">
                                {"★".repeat(review.rating)}
                                {"☆".repeat(5 - review.rating)}
                            </span>
                            {review.title && (
                                <span className="text-sm font-medium">{review.title}</span>
                            )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {formatDateTime(review.createdAt)}
                        </span>
                    </div>
                    {review.product && (
                        <p className="text-xs text-muted-foreground mt-1">
                            On {review.product.name}
                        </p>
                    )}
                    <p className="text-sm mt-2">{review.comment}</p>
                </div>
            ))}
        </div>
    );
}
