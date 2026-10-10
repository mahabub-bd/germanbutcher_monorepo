"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchProtectedData, formPostData, patchData, postData } from "@/utils/api-utils";
import type {
  Product,
  ReviewEligibility,
  User,
} from "@/utils/types";
import { ImagePlus, Loader2, Lock, LogIn, Pencil, Star } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ReviewItem } from "./review-item";
interface ReviewFormProps {
  product: Product;
  user: User | null;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // matches backend attachment limit

export function ReviewForm({ product, user }: ReviewFormProps) {
  const router = useRouter();
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(
    null
  );
  const [isChecking, setIsChecking] = useState(!!user);

  // Form state
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Photo state
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      setIsChecking(false);
      return;
    }
    let cancelled = false;
    const checkEligibility = async () => {
      try {
        const eligibility = await fetchProtectedData<ReviewEligibility>(
          `reviews/eligibility/${product.id}`
        );
        if (!cancelled) setEligibility(eligibility);
      } catch (error) {
        console.error("Error checking review eligibility:", error);
        if (!cancelled) setEligibility(null);
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    };
    checkEligibility();
    return () => {
      cancelled = true;
    };
  }, [user, product.id]);

  const startEditing = () => {
    if (eligibility?.review) {
      setRating(eligibility.review.rating);
      setTitle(eligibility.review.title || "");
      setComment(eligibility.review.comment);
      setExistingImageUrl(eligibility.review.attachment?.url || null);
    }
    setIsEditing(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setFile(selected);
    setRemoveImage(false);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(selected));
  };

  const clearNewImage = () => {
    setFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating < 1) {
      toast.error("Please select a star rating");
      return;
    }
    if (comment.trim().length < 5) {
      toast.error("Please write at least 5 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload the photo first if a new one was picked
      let attachmentId: string | undefined;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadResult = await formPostData("attachment", formData);
        attachmentId = uploadResult.data.id;
      }

      const reviewPayload = {
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        // undefined = keep current photo, null = remove it
        attachmentId: file ? attachmentId : removeImage ? null : undefined,
      };

      if (eligibility?.status === "already_reviewed" && eligibility.review) {
        await patchData(`reviews/${eligibility.review.id}`, reviewPayload);
        toast.success("Review updated — it will be re-reviewed before publishing.");
      } else {
        await postData(`reviews/product/${product.id}`, reviewPayload);
        toast.success("Thanks! Your review will appear once approved.");
      }
      // Reset photo state
      clearNewImage();
      setRemoveImage(false);
      setExistingImageUrl(null);
      // Refresh eligibility so the form reflects the new state.
      const updatedEligibility = await fetchProtectedData<ReviewEligibility>(
        `reviews/eligibility/${product.id}`
      );
      setEligibility(updatedEligibility);
      setIsEditing(false);
    } catch (error) {
      console.error("Error submitting review:", error);
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message
          : undefined;
      toast.error(errorMessage || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking review
        eligibility...
      </div>
    );
  }

  // Guests: sign-in prompt (same behaviour as the wishlist button)
  if (!user) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 md:p-5 shadow-sm">
        <div>
          <p className="text-sm font-medium text-gray-900">
            Have you tried this product?
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sign in to share your experience with other customers.
          </p>
        </div>
        <Button
          size="sm"
          className="bg-primaryColor hover:bg-primaryColor/90 text-white shrink-0"
          onClick={() => {
            toast.info("Please sign in to write a review");
            router.push("/auth/sign-in");
          }}
        >
          <LogIn className="mr-2 h-4 w-4" /> Sign in to write a review
        </Button>
      </div>
    );
  }

  // Non-buyers: info panel
  if (eligibility?.status === "not_verified_buyer") {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-muted-foreground">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" />
        Only verified buyers can review this product. Reviews become available
        once your order is confirmed.
      </div>
    );
  }

  // Already reviewed: full card only once approved; pending stays hidden
  if (eligibility?.status === "already_reviewed" && eligibility.review && !isEditing) {
    if (!eligibility.review.isApproved) {
      return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Your review was submitted and is awaiting approval. It will appear
            here once published.
          </p>
          <Button variant="outline" size="sm" onClick={startEditing} className="shrink-0">
            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit review
          </Button>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <ReviewItem
          review={eligibility.review}
          action={
            <>
              <span className="text-xs text-muted-foreground">
                Your review is live. Edits will be re-checked before publishing.
              </span>
              <Button variant="outline" size="sm" onClick={startEditing}>
                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit review
              </Button>
            </>
          }
        />
      </div>
    );
  }

  // Eligible (or editing): the review form
  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl rounded-xl border border-gray-100 bg-white p-4 shadow-sm space-y-3"
    >
      <h4 className="text-sm font-semibold text-gray-900">
        {eligibility?.status === "already_reviewed"
          ? "Edit your review"
          : "Write a review"}
      </h4>

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground shrink-0">
          Your rating
        </span>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHoveredRating(i + 1)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(i + 1)}
              className="rounded focus:outline-none focus:ring-2 focus:ring-primaryColor"
              aria-label={`${i + 1} star`}
            >
              <Star
                className={`h-5 w-5 transition-colors ${i < (hoveredRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300 hover:text-yellow-300"
                  }`}
              />
            </button>
          ))}
        </div>
      </div>

      <Input
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={150}
        className="h-9 text-sm"
      />

      <Textarea
        placeholder="Share your experience with this product..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={2000}
        className="text-sm"
      />

      {/* Photo picker */}
      <div className="flex items-center gap-3">
        {imagePreview ? (
          <div className="relative w-fit">
            <Image
              src={imagePreview}
              alt="Review photo preview"
              width={64}
              height={64}
              className="h-16 w-16 rounded-lg border border-gray-200 object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={clearNewImage}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white shadow"
              aria-label="Remove selected photo"
            >
              ×
            </button>
          </div>
        ) : existingImageUrl && !removeImage ? (
          <div className="relative w-fit">
            <Image
              src={existingImageUrl}
              alt="Current review photo"
              width={64}
              height={64}
              className="h-16 w-16 rounded-lg border border-gray-200 object-cover"
            />
            <button
              type="button"
              onClick={() => setRemoveImage(true)}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white shadow"
              aria-label="Remove photo"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 transition-colors hover:border-primaryColor hover:text-primaryColor"
          >
            <ImagePlus className="h-4 w-4" />
            <span className="text-[10px]">Add photo</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <p className="text-xs text-muted-foreground">
          JPG/PNG/WebP up to 5MB.

        </p>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-primaryColor hover:bg-primaryColor/90 text-white"
        >
          {isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {eligibility?.status === "already_reviewed"
            ? "Update review"
            : "Submit review"}
        </Button>
        {isEditing && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
