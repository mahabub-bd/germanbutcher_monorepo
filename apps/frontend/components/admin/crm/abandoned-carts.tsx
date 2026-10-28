"use client";

import type React from "react";

import { PaginationComponent } from "@/components/common/pagination";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { fetchDataPagination } from "@/utils/api-utils";
import { formatDateTime } from "@/lib/utils";
import { ShoppingCart, UserCircle } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

interface AbandonedCart {
  cartId: number;
  userId: number;
  name: string;
  email: string;
  mobileNumber: string | null;
  itemCount: number;
  cartValue: number;
  lastActivityAt: string;
  isOnline: boolean;
}

interface ListResponse {
  data: AbandonedCart[];
  total: number;
  totalPages: number;
}

interface AbandonedCartsProps {
  initialPage?: number;
  initialLimit?: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

export function AbandonedCarts({
  initialPage = 1,
  initialLimit = 10,
  initialSearchParams = {},
}: AbandonedCartsProps) {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [minDays, setMinDays] = useState(
    initialSearchParams?.minDays?.toString() || "3"
  );
  const [includeOnline, setIncludeOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCarts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());
      params.append("minDays", minDays || "0");
      if (includeOnline) params.append("includeOnline", "true");

      const response = await fetchDataPagination<ListResponse>(
        `crm/abandoned-carts?${params.toString()}`
      );
      setCarts(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching abandoned carts:", error);
      toast.error("Failed to load abandoned carts.");
      setCarts([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, limit, minDays, includeOnline]);

  useEffect(() => {
    fetchCarts();
  }, [fetchCarts]);

  const handleMinDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMinDays(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="w-full">
      <PageHeader
        title="Abandoned Carts"
        description="Carts with items untouched for days. Customers currently online are excluded until they leave."
      />

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="space-y-1">
            <Label htmlFor="min-days" className="text-sm">
              Untouched for (days)
            </Label>
            <Input
              id="min-days"
              type="number"
              min={0}
              className="h-8 w-32"
              value={minDays}
              onChange={handleMinDaysChange}
            />
          </div>
          <div className="flex items-center gap-2 pb-1">
            <Switch
              id="include-online"
              checked={includeOnline}
              onCheckedChange={(checked) => {
                setIncludeOnline(checked);
                setCurrentPage(1);
              }}
            />
            <Label htmlFor="include-online" className="text-sm">
              Include customers online now
            </Label>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingIndicator message="Loading abandoned carts..." />
          </div>
        ) : carts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No abandoned carts</h3>
            <p className="text-sm text-muted-foreground mt-2">
              No carts match the current filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="[&_td]:py-4 [&_th]:pb-3 [&_th]:pt-0">
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-right">Cart Value</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Last Activity
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carts.map((cart) => (
                  <TableRow key={cart.cartId} className="hover:bg-muted/50">
                    <TableCell>
                      <Link
                        href={`/admin/crm/customers/${cart.userId}`}
                        className="flex items-center gap-3 font-medium leading-tight hover:underline"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted text-sm font-semibold text-muted-foreground uppercase">
                          {cart.name?.charAt(0) || <UserCircle className="h-5 w-5" />}
                        </span>
                        <span className="truncate">{cart.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="block truncate max-w-[220px] text-muted-foreground">
                        {cart.email}
                      </span>
                      {cart.mobileNumber && (
                        <span className="text-xs text-muted-foreground">
                          {cart.mobileNumber}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {cart.itemCount}
                    </TableCell>
                    <TableCell className="text-right">
                      {cart.cartValue.toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="flex items-center gap-2">
                        {formatDateTime(cart.lastActivityAt)}
                        {cart.isOnline && (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                          >
                            Online now
                          </Badge>
                        )}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {!isLoading && carts.length > 0 && totalPages > 1 && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * limit + 1).toLocaleString()} -{" "}
              {Math.min(currentPage * limit, totalItems).toLocaleString()} of{" "}
              {totalItems.toLocaleString()} carts
            </div>
            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl="#"
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
