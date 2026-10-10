"use client";

import type React from "react";

import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { ActiveStatusToggle } from "@/components/common/active-status-toggle";
import { PaginationComponent } from "@/components/common/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActiveStatusToggle } from "@/hooks/use-active-status-toggle";
import { formatDateTime } from "@/lib/utils";
import { deleteData, fetchDataPagination, patchData } from "@/utils/api-utils";
import type { ProductReview } from "@/utils/types";
import {
  Filter,
  MessageSquare,
  MoreHorizontal,
  Search,
  Star,
  Trash2,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

type ReviewStatusFilter = "all" | "pending" | "approved" | "rejected";

interface ReviewListProps {
  initialPage: number;
  initialLimit: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

// Helper to render star rating (1-5)
const renderStarRating = (rating: number) => (
  <div className="flex items-center gap-1">
    {Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
      />
    ))}
  </div>
);

export function ReviewList({
  initialPage,
  initialLimit,
  initialSearchParams = {},
}: ReviewListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const MENU_URL = "/admin/review/review-list";
  const { can } = usePermissions();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [searchQuery, setSearchQuery] = useState(
    getInitialParam("search") as string
  );
  const [statusFilter, setStatusFilter] = useState<ReviewStatusFilter>(
    (getInitialParam("status") as ReviewStatusFilter) || "all"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ProductReview | null>(
    null
  );
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);

  const { togglingId, toggleActive } = useActiveStatusToggle<ProductReview>({
    getId: (review) => review.id,
    getName: (review) => `review by ${review.user?.name || "customer"}`,
    getStatus: (review) => review.isApproved,
    buildEndpoint: (id) => `reviews/admin/${id}`,
    buildBody: (isApproved) => ({ isApproved, isRejected: false }),
    statusLabels: { on: "approved", off: "pending" },
    setStatusLocally: (id, isApproved) =>
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isApproved, isRejected: false } : r))
      ),
    errorLabel: "review status",
  });

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();

    params.set("page", currentPage.toString());
    params.set("limit", limit.toString());

    if (searchQuery) params.set("search", searchQuery);
    if (statusFilter && statusFilter !== "all")
      params.set("status", statusFilter);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, currentPage, limit, searchQuery, statusFilter]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());

      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter && statusFilter !== "all")
        params.append("status", statusFilter);

      const response = await fetchDataPagination<{
        data: ProductReview[];
        total: number;
        totalPages: number;
      }>(`reviews/admin?${params.toString()}`);
      setReviews(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to load reviews. Please try again.");
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchReviews();
    updateUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, limit, searchQuery, statusFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDeleteClick = (review: ProductReview) => {
    setSelectedReview(review);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedReview) return;

    try {
      await deleteData("reviews/admin", selectedReview.id);
      fetchReviews();
      toast.success("Review deleted successfully");
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleReject = async (review: ProductReview) => {
    const prevReviews = reviews;
    // Optimistic update
    setReviews((prev) =>
      prev.map((r) =>
        r.id === review.id ? { ...r, isRejected: true, isApproved: false } : r
      )
    );
    try {
      await patchData(`reviews/admin/${review.id}`, {
        isRejected: true,
        isApproved: false,
      });
      toast.success(`Review by ${review.user?.name || "customer"} rejected`);
    } catch (error) {
      console.error("Error rejecting review:", error);
      setReviews(prevReviews);
      toast.error("Failed to reject review. Please try again.");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <MessageSquare className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No reviews found</h3>
      <p className="text-sm text-muted-foreground mt-2">
        {searchQuery || statusFilter !== "all"
          ? "No reviews match your search criteria. Try different filters."
          : "Customer reviews will appear here once submitted."}
      </p>
      {(searchQuery || statusFilter !== "all") && (
        <Button variant="outline" className="mt-4" onClick={clearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  );

  const renderActiveFilters = () => {
    const hasFilters = searchQuery || statusFilter !== "all";

    if (!hasFilters) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {searchQuery && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Search: {searchQuery}
            <button onClick={() => setSearchQuery("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {statusFilter !== "all" && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Status: {statusFilter}
            <button
              onClick={() => {
                setStatusFilter("all");
                setCurrentPage(1);
              }}
              className="ml-1"
            >
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-7 text-xs"
        >
          Clear all
        </Button>
      </div>
    );
  };

  const renderStatusBadge = (review: ProductReview) => {
    if (review.isRejected) {
      return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
    }
    if (review.isApproved) {
      return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
  };

  const renderTableView = () => (
    <Table className="[&_td]:py-4 [&_th]:pb-3 [&_th]:pt-0">
      <TableHeader>
        <TableRow>
          <TableHead>Review</TableHead>
          <TableHead className="hidden md:table-cell">Date</TableHead>
          <TableHead className="hidden md:table-cell">Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reviews?.map((review) => {
          const reviewerName = review.user?.name || "Unknown";
          return (
            <TableRow key={review.id} className="align-top hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center gap-3">
                  {/* Reviewer avatar with initial */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondaryColor to-primaryColor text-xs font-semibold text-white">
                    {reviewerName.charAt(0).toUpperCase()}
                  </div>

                  <span className="shrink-0 text-sm font-medium text-foreground">
                    {reviewerName}
                  </span>
                  <div className="shrink-0">{renderStarRating(review.rating)}</div>

                  {review.title && (
                    <span
                      className="hidden max-w-40 truncate text-sm font-medium text-foreground lg:inline"
                      title={review.title}
                    >
                      {review.title}
                    </span>
                  )}

                  <p
                    className="min-w-0 flex-1 truncate text-sm text-muted-foreground"
                    title={review.comment}
                  >
                    {review.comment}
                  </p>

                  <span className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground xl:flex">
                    on{" "}
                    {review.product?.slug ? (
                      <Link
                        href={`/product/${review.product.slug}`}
                        target="_blank"
                        className="max-w-36 truncate font-medium text-foreground hover:underline"
                        title={review.product?.name}
                      >
                        {review.product?.name || "—"}
                      </Link>
                    ) : (
                      <span className="font-medium text-foreground">
                        {review.product?.name || "—"}
                      </span>
                    )}
                  </span>

                  {review.attachment?.url && (
                    <a
                      href={review.attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                      title="Open review photo"
                    >
                      <Image
                        src={review.attachment.url}
                        alt="Review photo"
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-lg border border-gray-200 object-cover"
                      />
                    </a>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <span className="text-sm text-muted-foreground">
                  {formatDateTime(review.createdAt)}
                </span>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex flex-col items-start gap-2">
                  {/* The toggle's own label already says Approved/Pending —
                      only Rejected needs the extra badge. */}
                  {review.isRejected && renderStatusBadge(review)}
                  <ActiveStatusToggle
                    isActive={review.isApproved}
                    disabled={togglingId === review.id || review.isRejected}
                    onToggle={() => toggleActive(review)}
                    label={`review by ${review.user?.name || "customer"}`}
                    labels={{ on: "Approved", off: "Pending" }}
                  />
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {can(MENU_URL, "canEdit") && !review.isRejected && (
                      <DropdownMenuItem onClick={() => handleReject(review)}>
                        <XCircle className="mr-2 h-4 w-4" /> Reject
                      </DropdownMenuItem>
                    )}
                    {can(MENU_URL, "canEdit") && review.isRejected && (
                      <DropdownMenuItem onClick={() => toggleActive(review)}>
                        <Star className="mr-2 h-4 w-4" /> Approve
                      </DropdownMenuItem>
                    )}
                    {can(MENU_URL, "canDelete") && (
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteClick(review)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  return (
    <>
      <div className="w-full md:p-4 p-2 ">
        <PageHeader
          title="Product Reviews"
          description="Moderate customer reviews"
        />

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search reviews..."
                className="pl-8"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 px-3"
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 p-3 rounded-lg shadow-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800"
                  sideOffset={8}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Filters</h4>
                      {statusFilter !== "all" && (
                        <button
                          onClick={clearFilters}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">
                        Status
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        <button
                          onClick={() => {
                            setStatusFilter("all");
                            setCurrentPage(1);
                          }}
                          className={`text-xs py-1.5 px-2 rounded-md border ${statusFilter === "all"
                            ? "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                            : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                            }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => {
                            setStatusFilter("pending");
                            setCurrentPage(1);
                          }}
                          className={`text-xs py-1.5 px-2 rounded-md border flex items-center justify-center gap-1 ${statusFilter === "pending"
                            ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400"
                            : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                            }`}
                        >
                          <span className="h-2 w-2 rounded-full bg-yellow-500" />
                          Pending
                        </button>
                        <button
                          onClick={() => {
                            setStatusFilter("approved");
                            setCurrentPage(1);
                          }}
                          className={`text-xs py-1.5 px-2 rounded-md border flex items-center justify-center gap-1 ${statusFilter === "approved"
                            ? "bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800 text-green-600 dark:text-green-400"
                            : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                            }`}
                        >
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                          Approved
                        </button>
                        <button
                          onClick={() => {
                            setStatusFilter("rejected");
                            setCurrentPage(1);
                          }}
                          className={`text-xs py-1.5 px-2 rounded-md border flex items-center justify-center gap-1 ${statusFilter === "rejected"
                            ? "bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800 text-red-600 dark:text-red-400"
                            : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                            }`}
                        >
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                          Rejected
                        </button>
                      </div>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {renderActiveFilters()}

          {isLoading ? (
            <LoadingIndicator message="Loading Reviews..." />
          ) : reviews.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="mt-6">{renderTableView()}</div>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground text-center md:text-left truncate">
              {`Showing ${reviews.length} of ${totalItems} reviews`}
            </p>
          </div>

          <div className="flex-1 w-full md:w-auto">
            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl="#"
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
