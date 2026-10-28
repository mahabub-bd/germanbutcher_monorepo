"use client";

import type React from "react";

import { SegmentBadge } from "@/components/admin/crm/segment-badge";
import { PaginationComponent } from "@/components/common/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/utils";
import { fetchDataPagination } from "@/utils/api-utils";
import { Search, UserCircle, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

interface CrmCustomer {
  id: number;
  name: string;
  email: string;
  mobileNumber: string | null;
  isVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  profilePhoto: { id: number; url: string } | null;
  rfm: {
    orderCount: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderAt: string | null;
  };
  segment: string;
}

interface ListResponse {
  data: CrmCustomer[];
  total: number;
  totalPages: number;
}

const SEGMENTS = [
  { value: "all", label: "All" },
  { value: "vip", label: "VIP" },
  { value: "loyal", label: "Loyal" },
  { value: "at_risk", label: "At Risk" },
  { value: "new", label: "New" },
  { value: "inactive", label: "Inactive" },
];

interface CrmCustomerListProps {
  initialPage?: number;
  initialLimit?: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

export function CrmCustomerList({
  initialPage = 1,
  initialLimit = 10,
  initialSearchParams = {},
}: CrmCustomerListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [customers, setCustomers] = useState<CrmCustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState(
    getInitialParam("search") as string
  );
  const [segment, setSegment] = useState(
    (getInitialParam("segment") as string) || "all"
  );
  const [isLoading, setIsLoading] = useState(true);

  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", currentPage.toString());
    params.set("limit", limit.toString());
    if (searchQuery) params.set("search", searchQuery);
    if (segment !== "all") params.set("segment", segment);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, currentPage, limit, searchQuery, segment]);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());
      if (searchQuery) params.append("search", searchQuery);
      if (segment !== "all") params.append("segment", segment);

      const response = await fetchDataPagination<ListResponse>(
        `crm/customers?${params.toString()}`
      );

      setCustomers(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching CRM customers:", error);
      toast.error("Failed to load customers. Please try again.");
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, limit, searchQuery, segment]);

  useEffect(() => {
    const pageFromUrl = searchParams?.get("page");
    const searchFromUrl = searchParams?.get("search");
    const segmentFromUrl = searchParams?.get("segment");

    if (pageFromUrl) setCurrentPage(parseInt(pageFromUrl, 10));
    if (searchFromUrl) setSearchQuery(searchFromUrl);
    if (segmentFromUrl) setSegment(segmentFromUrl);
  }, [searchParams]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  return (
    <div className="w-full">
      <PageHeader
        title="CRM Customers"
        description="Segments from order activity: VIP (20,000+ spent or 10+ orders), At Risk (no order in 90 days), New (joined in 30 days), Inactive (no orders)"
      />

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <Tabs
            value={segment}
            onValueChange={(value) => {
              setSegment(value);
              setCurrentPage(1);
            }}
          >
            <TabsList>
              {SEGMENTS.map((seg) => (
                <TabsTrigger key={seg.value} value={seg.value}>
                  {seg.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, email, or phone..."
              className="h-8 pl-10 pr-4"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {searchQuery && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
              Search: {searchQuery}
              <button
                onClick={clearSearch}
                className="ml-1 hover:opacity-70"
                aria-label="Clear search"
              >
                <XCircle className="h-3 w-3" />
              </button>
            </Badge>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingIndicator message="Loading customers..." />
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <UserCircle className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No customers found</h3>
            <p className="text-sm text-muted-foreground mt-2">
              No customers match the current filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="[&_td]:py-4 [&_th]:pb-3 [&_th]:pt-0">
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-center">Orders</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                  <TableHead className="hidden md:table-cell text-right">
                    Avg Order
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Last Order
                  </TableHead>
                  <TableHead>Segment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Link
                        href={`/admin/crm/customers/${customer.id}`}
                        className="flex items-center gap-3 font-medium leading-tight hover:underline"
                      >
                        {customer.profilePhoto?.url ? (
                          <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border bg-muted">
                            <Image
                              src={customer.profilePhoto.url}
                              alt={customer.name || "Customer"}
                              fill
                              className="object-contain"
                            />
                          </span>
                        ) : (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted text-sm font-semibold text-muted-foreground uppercase">
                            {customer.name?.charAt(0) || "?"}
                          </span>
                        )}
                        <span className="truncate">
                          {customer.name}
                          <span className="block text-xs font-normal text-muted-foreground">
                            {customer.email}
                          </span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">
                      {customer.rfm.orderCount}
                    </TableCell>
                    <TableCell className="text-right">
                      {customer.rfm.totalSpent.toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right">
                      {customer.rfm.averageOrderValue.toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {customer.rfm.lastOrderAt
                        ? formatDateTime(customer.rfm.lastOrderAt)
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      <SegmentBadge segment={customer.segment} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {!isLoading && customers.length > 0 && totalPages > 1 && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * limit + 1).toLocaleString()} -{" "}
              {Math.min(currentPage * limit, totalItems).toLocaleString()} of{" "}
              {totalItems.toLocaleString()} customers
            </div>

            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl="#"
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
