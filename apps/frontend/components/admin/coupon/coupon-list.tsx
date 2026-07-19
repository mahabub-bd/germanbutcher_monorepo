"use client";

import { StatusCard } from "@/components/admin/dashboard/status-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";

import { deleteData, fetchProtectedData } from "@/utils/api-utils";
import { Coupon } from "@/utils/types";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Tag,
  Trash2,
  XCircle,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

export function CouponList() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const response = await fetchProtectedData("coupons");
      setCoupons(response as Coupon[]);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast.error("Failed to load coupons. Please try again.");
      setCoupons([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleDeleteClick = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedCoupon) return;

    try {
      await deleteData("coupons", selectedCoupon.id);
      fetchCoupons();
      toast.success("Coupon deleted successfully");
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast.error("Failed to delete coupon. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  // Helper function to check if coupon is expired
  const isCouponExpired = (coupon: Coupon): boolean => {
    const now = new Date();
    return new Date(coupon.validUntil) < now;
  };

  // Helper function to check if coupon is expiring soon (within 7 days)
  const isCouponExpiringSoon = (coupon: Coupon): boolean => {
    const now = new Date();
    const validUntil = new Date(coupon.validUntil);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    return validUntil > now && validUntil <= sevenDaysFromNow;
  };

  // Helper function to get coupon status
  const getCouponStatus = (coupon: Coupon) => {
    if (isCouponExpired(coupon)) {
      return {
        variant: "destructive" as const,
        label: "Expired",
        icon: <AlertTriangle className="h-3 w-3 mr-1" />,
      };
    }

    if (isCouponExpiringSoon(coupon)) {
      return {
        variant: "secondary" as const,
        label: "Expiring Soon",
        icon: <Clock className="h-3 w-3 mr-1" />,
      };
    }

    if (!coupon.isActive) {
      return {
        variant: "secondary" as const,
        label: "Inactive",
        icon: null,
      };
    }

    return {
      variant: "default" as const,
      label: "Active",
      icon: null,
    };
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Tag className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No coupons found</h3>
      <p className="text-sm text-muted-foreground mt-2">
        Get started by creating your first coupon.
      </p>
      <Button asChild className="mt-4">
        <Link href="/admin/marketing/coupon/add">
          <Plus className="mr-2 h-4 w-4" /> Add Coupon
        </Link>
      </Button>
    </div>
  );

  const renderTableView = () => (
    <div className="md:p-2 p-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Min. Order</TableHead>
            <TableHead>Valid Period</TableHead>
            <TableHead>Max Discount</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="hidden md:table-cell">Valid From</TableHead>

            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coupons.map((coupon) => {
            const status = getCouponStatus(coupon);
            const isExpired = isCouponExpired(coupon);

            return (
              <TableRow
                key={coupon.id}
                className={
                  isExpired ? "opacity-60 bg-red-50 dark:bg-red-950/20" : ""
                }
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {coupon.code}
                    </Badge>
                    {isExpired && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {coupon.discountType === "percentage"
                    ? `${coupon.value}%`
                    : `${coupon.value}`}
                </TableCell>
                <TableCell>
                  <span className={isExpired ? "text-muted-foreground" : ""}>
                    {coupon.timesUsed} / {coupon.maxUsage || "∞"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={isExpired ? "text-muted-foreground" : ""}>
                    {coupon?.minOrderAmount || "No minimum"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div
                      className={
                        isExpired ? "text-muted-foreground line-through" : ""
                      }
                    >
                      {formatDateTime(coupon.validFrom)} -{" "}
                      {formatDateTime(coupon.validUntil)}
                    </div>
                    {isExpired && (
                      <div className="text-red-500 text-xs mt-1 flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Expired
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className={isExpired ? "text-muted-foreground" : ""}>
                    {coupon?.maxDiscountAmount || "No limit"}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge
                    variant={status.variant}
                    className="flex items-center w-fit"
                  >
                    {status.icon}
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className={isExpired ? "text-muted-foreground" : ""}>
                    {formatDateTime(coupon.createdAt)}
                  </span>
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
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/admin/marketing/coupon/${coupon?.code}/usage-logs`}
                        >
                          <Eye className="mr-2 h-4 w-4" /> Usage Logs
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/admin/marketing/coupon/${coupon?.code}/edit`}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteClick(coupon)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  const expiredCount = coupons.filter(isCouponExpired).length;
  const expiringSoonCount = coupons.filter(isCouponExpiringSoon).length;

  return (
    <>
      <div className="w-full md:p-6 p-2">
        <div className="flex items-center justify-between mb-6">
          <PageHeader
            title="Coupons"
            description="Manage discount coupons and promotions"
            actionLabel="Add Coupon"
            actionHref="/admin/marketing/coupon/add"
          />
          <Button
            variant="outline"
            className="ml-2"
            asChild
          >
            <Link href="/admin/marketing/coupon/usage-logs">
              <FileText className="mr-2 h-4 w-4" />
              View All Usage Logs
            </Link>
          </Button>
        </div>

        {/* Summary Cards */}
        {coupons.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatusCard
              title="Total Coupons"
              value={coupons.length}
              icon={Tag}
              href="#"
              color="text-blue-600 dark:text-blue-400"
              gradient="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
            />
            <StatusCard
              title="Active"
              value={coupons.filter((c) => !isCouponExpired(c) && c.isActive).length}
              icon={CheckCircle}
              href="#"
              color="text-green-600 dark:text-green-400"
              gradient="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
            />
            <StatusCard
              title="Expiring Soon"
              value={expiringSoonCount}
              icon={Clock}
              href="#"
              color="text-orange-600 dark:text-orange-400"
              gradient="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20"
            />
            <StatusCard
              title="Expired"
              value={expiredCount}
              icon={XCircle}
              href="#"
              color="text-red-600 dark:text-red-400"
              gradient="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20"
            />
          </div>
        )}

        <div className="space-y-4">
          {isLoading ? (
            <LoadingIndicator message="Loading coupons..." />
          ) : coupons.length === 0 ? (
            renderEmptyState()
          ) : (
            <div>{renderTableView()}</div>
          )}
        </div>

        <div className="flex justify-between">
          <div className="text-xs text-muted-foreground">
            {coupons.length} {coupons.length === 1 ? "coupon" : "coupons"}
            {expiredCount > 0 && (
              <span className="text-red-500 ml-2">
                ({expiredCount} expired)
              </span>
            )}
          </div>
        </div>
      </div>

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        defaultToast={false}
      />
    </>
  );
}
