"use client";

import { AccountPageHeader } from "@/components/user-account/account-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaginationComponent } from "@/components/common/pagination";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formPostData } from "@/utils/api-utils";
import { formatDateTime } from "@/lib/utils";
import { PaginatedEnvelope, ProductReview } from "@/utils/types";
import { ImagePlus, Loader2, PencilLine, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface MyReviewsProps {
  reviewsData: PaginatedEnvelope<ProductReview>;
  userId: string;
  currentPage: number;
  onEditReview?: (
    reviewId: number,
    payload: {
      rating: number;
      title?: string;
      comment: string;
      attachmentId?: string | null;
    }
  ) => Promise<void>;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // matches backend attachment limit

const ReviewStatusBadge = ({ review }: { review: ProductReview }) => {
  if (review.isRejected) {
    return (
      <Badge className="rounded-full bg-red-100 text-red-700">Rejected</Badge>
    );
  }
  if (review.isApproved) {
    return (
      <Badge className="rounded-full bg-green-100 text-green-700">
        Approved
      </Badge>
    );
  }
  return (
    <Badge className="rounded-full bg-yellow-100 text-yellow-700">Pending</Badge>
  );
};

const RatingStars = ({
  rating,
  size = "h-4 w-4",
}: {
  rating: number;
  size?: string;
}) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((value) => (
      <Star
        key={value}
        className={`${size} ${
          value <= rating
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ))}
  </div>
);

const MyReviews = ({
  reviewsData,
  userId,
  currentPage,
  onEditReview,
}: MyReviewsProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ProductReview | null>(
    null
  );
  const [editRating, setEditRating] = useState(0);
  const [editTitle, setEditTitle] = useState("");
  const [editComment, setEditComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Edit photo state (same flow as the product-page review form)
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(
    null
  );
  const [editExistingImageUrl, setEditExistingImageUrl] = useState<
    string | null
  >(null);
  const [editRemoveImage, setEditRemoveImage] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const reviews = reviewsData?.data ?? [];

  const openEditDialog = (review: ProductReview) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditTitle(review.title || "");
    setEditComment(review.comment);
    setEditFile(null);
    setEditImagePreview(null);
    setEditExistingImageUrl(review.attachment?.url || null);
    setEditRemoveImage(false);
    setIsEditOpen(true);
  };

  const closeEditDialog = () => {
    setIsEditOpen(false);
    if (editImagePreview) URL.revokeObjectURL(editImagePreview);
  };

  const handleEditFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (selected.size > MAX_IMAGE_SIZE) {
      toast.error("Image must be under 5MB");
      return;
    }
    setEditFile(selected);
    setEditRemoveImage(false);
    if (editImagePreview) URL.revokeObjectURL(editImagePreview);
    setEditImagePreview(URL.createObjectURL(selected));
  };

  const clearEditNewImage = () => {
    setEditFile(null);
    if (editImagePreview) URL.revokeObjectURL(editImagePreview);
    setEditImagePreview(null);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const handleEditSubmit = async () => {
    if (!editingReview || !onEditReview) return;
    if (editRating < 1) {
      toast.error("Please select a star rating");
      return;
    }
    if (editComment.trim().length < 5) {
      toast.error("Please write at least 5 characters");
      return;
    }

    setIsSaving(true);
    try {
      // Upload the replacement photo first if a new one was picked
      let attachmentId: string | undefined;
      if (editFile) {
        const formData = new FormData();
        formData.append("file", editFile);
        const uploadResult = await formPostData("attachment", formData);
        attachmentId = uploadResult.data.id;
      }

      await onEditReview(editingReview.id, {
        rating: editRating,
        // empty string clears the title (backend allows 0–150 chars)
        title: editTitle.trim(),
        comment: editComment.trim(),
        // undefined = keep current photo, null = remove it
        attachmentId: editFile
          ? attachmentId
          : editRemoveImage
            ? null
            : undefined,
      });
      toast.success("Review updated — it is pending approval again");
      setIsEditOpen(false);
    } catch {
      toast.error("Failed to update review");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full">
      <AccountPageHeader
        title="My Reviews"
        icon={<Star className="h-5 w-5" />}
        subtitle={`${reviewsData?.total ?? 0} ${
          reviewsData?.total === 1 ? "review" : "reviews"
        }`}
      />

      {reviews.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <Star className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            No reviews yet
          </h2>
          <p className="mb-6 text-gray-600">
            Reviews you write about products will appear here.
          </p>
          <Link
            href="/products"
            className="inline-block rounded-lg bg-primaryColor px-6 py-3 text-white transition-colors hover:bg-primaryColor/90"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-gray-200 bg-white p-5"
            >
              <div className="flex items-start gap-4">
                {review.product?.attachment?.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={review.product.attachment.url}
                    alt={review.product.name}
                    className="h-16 w-16 shrink-0 rounded-lg border border-gray-100 object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {review.product ? (
                        <Link
                          href={`/product/${review.product.slug}`}
                          className="font-semibold text-gray-900 transition-colors hover:text-primaryColor"
                        >
                          {review.product.name}
                        </Link>
                      ) : (
                        <span className="font-semibold text-gray-900">
                          Product unavailable
                        </span>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-3">
                        <RatingStars rating={review.rating} />
                        <ReviewStatusBadge review={review} />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditDialog(review)}
                      className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-primaryColor transition-colors"
                    >
                      <PencilLine className="h-4 w-4" />
                      Edit
                    </button>
                  </div>

                  {review.title && (
                    <p className="mt-2 text-sm font-semibold text-gray-900">
                      {review.title}
                    </p>
                  )}
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    {review.comment}
                  </p>
                  {review.attachment?.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={review.attachment.url}
                      alt={`Photo for review of ${review.product?.name ?? "product"}`}
                      className="mt-2 h-20 w-20 rounded-lg border border-gray-100 object-cover"
                    />
                  )}
                  <p className="mt-2 text-xs text-gray-400">
                    {formatDateTime(review.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {reviewsData.totalPages > 1 && (
            <PaginationComponent
              currentPage={currentPage}
              totalPages={reviewsData.totalPages}
              baseUrl="?page="
            />
          )}
        </div>
      )}

      {/* Edit Review Dialog */}
      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => (open ? setIsEditOpen(true) : closeEditDialog())}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
            <DialogDescription>
              {editingReview?.product?.name} — editing resets your review to
              pending approval.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">
                Your rating
              </p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setEditRating(value)}
                    aria-label={`${value} star`}
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        value <= editRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 hover:text-yellow-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Title</p>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Title (optional)"
                maxLength={150}
                className="h-9 text-sm"
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Photo</p>
              <div className="flex items-center gap-3">
                {editImagePreview ? (
                  <div className="relative w-fit">
                    <Image
                      src={editImagePreview}
                      alt="New review photo preview"
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-lg border border-gray-200 object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={clearEditNewImage}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white shadow"
                      aria-label="Remove selected photo"
                    >
                      ×
                    </button>
                  </div>
                ) : editExistingImageUrl && !editRemoveImage ? (
                  <div className="relative w-fit">
                    <Image
                      src={editExistingImageUrl}
                      alt="Current review photo"
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-lg border border-gray-200 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setEditRemoveImage(true)}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white shadow"
                      aria-label="Remove photo"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 transition-colors hover:border-primaryColor hover:text-primaryColor"
                  >
                    <ImagePlus className="h-4 w-4" />
                    <span className="text-[10px]">Add photo</span>
                  </button>
                )}
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleEditFileChange}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground">
                  JPG/PNG/WebP up to 5MB.
                </p>
              </div>
              {editRemoveImage && (
                <button
                  type="button"
                  onClick={() => setEditRemoveImage(false)}
                  className="mt-1 text-xs text-primaryColor hover:underline"
                >
                  Undo remove — keep current photo
                </button>
              )}
            </div>

            <Textarea
              value={editComment}
              onChange={(e) => setEditComment(e.target.value)}
              placeholder="Write your review..."
              rows={4}
              maxLength={2000}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeEditDialog}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyReviews;
