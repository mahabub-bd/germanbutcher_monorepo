"use client";

import { PaginationComponent } from "@/components/common/pagination";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchDataPagination } from "@/utils/api-utils";
import { Truck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

interface FreeDeliveryUsageLog {
  id: number;
  campaignName: string;
  campaign?: { id: number; name: string };
  order?: { id: number; orderNo: string };
  user?: { id: number; name: string; email: string };
  shippingWaived: string | number;
  orderTotal: string | number;
  createdAt: string;
}

export function FreeDeliveryUsageLogList() {
  const [logs, setLogs] = useState<FreeDeliveryUsageLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await fetchDataPagination<{
        data: FreeDeliveryUsageLog[];
        total: number;
        totalPages: number;
      }>(`free-delivery-usage-logs?page=${currentPage}&limit=${limit}`);
      setLogs(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching free delivery usage logs:", error);
      toast.error("Failed to load usage logs. Please try again.");
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const formatMoney = (value: string | number) => `৳${Number(value).toFixed(2)}`;

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Truck className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No usage logs yet</h3>
      <p className="text-sm text-muted-foreground mt-2">
        Each time a customer's order gets free delivery from a campaign, it
        will be logged here.
      </p>
    </div>
  );

  return (
    <div className="w-full md:p-6 p-2">
      <PageHeader
        title="Free Delivery Usage Logs"
        description="Which customer used which free delivery campaign"
      />
      {isLoading ? (
        <LoadingIndicator message="Loading usage logs..." />
      ) : logs.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="mt-6">
          <Table className="[&_td]:py-4 [&_th]:pb-3 [&_th]:pt-0">
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead className="hidden md:table-cell">Shipping Waived</TableHead>
                <TableHead className="hidden md:table-cell">Order Total</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondaryColor to-primaryColor text-xs font-semibold text-white">
                        {(log.user?.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight text-foreground">
                          {log.user?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-52">
                          {log.user?.email || "—"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.order?.orderNo ? (
                      <Link href="/admin/orders" className="text-sm font-medium text-foreground hover:underline">
                        {log.order.orderNo}
                      </Link>
                    ) : (
                      <span className="text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-primaryColor/5 text-primaryColor border-primaryColor/20">
                      {log.campaignName}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      {formatMoney(log.shippingWaived)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm">{formatMoney(log.orderTotal)}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground text-center md:text-left truncate">
            {`Showing ${logs.length} of ${totalItems} usage logs`}
          </p>
        </div>
        <div className="flex-1 w-full md:w-auto">
          <PaginationComponent
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl="#"
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </div>
    </div>
  );
}
