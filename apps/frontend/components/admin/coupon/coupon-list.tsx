"use client";

import { usePermissions } from "@/components/admin/permissions/use-permissions";
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
import { formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
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
  Search,
  Tag,
  TicketPercent,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import { LoadingIndicator } from "../loading-indicator";
import { cn } from "@/lib/utils";

export function CouponList() {
  const MENU_URL = "/admin/marketing/coupon/coupon-list";
  const { can } = usePermissions();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const activeCount = coupons.filter(
    (c) => !isCouponExpired(c) && c.isActive
  ).length;
  const expiringSoonCount = coupons.filter(isCouponExpiringSoon).length;
  const expiredCount = coupons.filter(isCouponExpired).length;

  const filteredCoupons = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return coupons;
    return coupons.filter((coupon) =>
      coupon.code.toLowerCase().includes(query)
    );
  }, [coupons, searchQuery]);

  const summaryTiles = [
    {
      title: "Total Coupons",
      value: coupons.length,
      icon: Tag,
      tile: "bg-blue-100 text-blue-600",
    },
    {
      title: "Active",
      value: activeCount,
      icon: CheckCircle,
      tile: "bg-green-100 text-green-600",
    },
    {
      title: "Expiring Soon",
      value: expiringSoonCount,
      icon: Clock,
      tile: "bg-orange-100 text-orange-600",
    },
    {
      title: "Expired",
      value: expiredCount,
      icon: XCircle,
      tile: "bg-red-100 text-red-600",
    },
  ];

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center border border-dashed rounded-xl p-12 text-center">
      <Tag className="h-10 w-10 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-semibold">No coupons found</h3>
      <p className="text-sm text-muted-foreground mt-2">
        {searchQuery
          ? "No coupons match your search."
          : "Get started by creating your first coupon."}
      </p>
      {!searchQuery && can(MENU_URL, "canCreate") && (
        <Button
          asChild
          className="mt-4 bg-primaryColor hover:bg-primaryColor/90 text-white"
        >
          <Link href="/admin/marketing/coupon/add">
            <Plus className="mr-2 h-4 w-4" /> Add Coupon
          </Link>
        </Button>
      )}
    </div>
  );

  return (
    <>
      <div className="w-full space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <Tag className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-2xl font-bold">Coupons</h2>
              <p className="text-sm text-muted-foreground">
                Manage discount coupons and promotions
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/marketing/coupon/usage-logs">
                <Eye className="h-4 w-4 mr-1" />
                Usage Logs
              </Link>
            </Button>
            {can(MENU_URL, "canCreate") && (
              <Button
                asChild
                className="bg-primaryColor hover:bg-primaryColor/90 text-white"
              >
                <Link href="/admin/marketing/coupon/add">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Coupon
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Summary tiles */}
        {coupons.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryTiles.map((tile) => (
              <div
                key={tile.title}
                className="flex items-center gap-3 rounded-xl border bg-card p-4"
              >
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    tile.tile
                  )}
                >
                  <tile.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-2xl font-bold leading-none">
                    {tile.value}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tile.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Coupon table */}
        <div className="rounded-xl border bg-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <TicketPercent className="h-4.5 w-4.5" />
              </span>
              <div>
                <h3 className="font-semibold leading-tight">All Coupons</h3>
                <p className="text-sm text-muted-foreground">
                  {filteredCoupons.length} of {coupons.length} coupon
                  {coupons.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by code..."
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <LoadingIndicator message="Loading coupons..." />
          ) : filteredCoupons.length === 0 ? (
            renderEmptyState()
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Min. Order
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Valid Period
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCoupons.map((coupon) => {
                  const status = getCouponStatus(coupon);
                  const isExpired = isCouponExpired(coupon);
                  const usagePercent =
                    coupon.maxUsage > 0
                      ? Math.min(
                          100,
                          (coupon.timesUsed / coupon.maxUsage) * 100
                        )
                      : 0;

                  return (
                    <TableRow
                      key={coupon.id}
                      className={isExpired ? "opacity-60" : ""}
                    >
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {coupon.code}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-red-600">
                          {coupon.discountType === "percentage"
                            ? `${coupon.value}%`
                            : formatCurrencyEnglish(coupon.value)}
                        </div>
                        {coupon.maxDiscountAmount ? (
                          <div className="text-xs text-muted-foreground">
                            Max {formatCurrencyEnglish(coupon.maxDiscountAmount)}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          {coupon.timesUsed} / {coupon.maxUsage || "∞"}
                        </div>
                        {coupon.maxUsage > 0 && (
                          <div className="mt-1.5 h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                usagePercent >= 100
                                  ? "bg-red-500"
                                  : "bg-green-500"
                              )}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {coupon.minOrderAmount
                          ? formatCurrencyEnglish(coupon.minOrderAmount)
                          : "No minimum"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="text-sm">
                          {formatDateTime(coupon.validFrom)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          → {formatDateTime(coupon.validUntil)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={status.variant}
                          className="flex items-center w-fit"
                        >
                          {status.icon}
                          {status.label}
                        </Badge>
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
                            {can(MENU_URL, "canEdit") && (
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/admin/marketing/coupon/${coupon?.code}/edit`}
                                >
                                  <Pencil className="mr-2 h-4 w-4" /> Edit
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {can(MENU_URL, "canDelete") && (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteClick(coupon)}
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
          )}
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
