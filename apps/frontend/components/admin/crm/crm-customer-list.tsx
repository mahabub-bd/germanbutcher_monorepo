"use client";

import type React from "react";

import { SegmentBadge } from "@/components/admin/crm/segment-badge";
import { PaginationComponent } from "@/components/common/pagination";
import { TableSearch } from "@/components/common/table-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  apiUrl,
  fetchDataPagination,
  fetchProtectedData,
  resolveAuthToken,
} from "@/utils/api-utils";
import {
  Crown,
  FileSpreadsheet,
  Heart,
  MapPin,
  Sparkles,
  TrendingDown,
  UserCircle,
  UserX,
  Users,
  XCircle,
} from "lucide-react";
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
  area: string | null;
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

// Minimal RFC-4180 parser for the backend's fully-quoted CSV exports.
function parseQuotedCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  row.push(field);
  if (row.length > 1 || row[0] !== "") rows.push(row);
  return rows;
}

const SEGMENTS = [
  {
    value: "all",
    label: "All",
    icon: <Users className="size-3.5 sm:size-4" />,
    colors: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-900",
    activeColors: "data-[state=active]:bg-slate-800 data-[state=active]:text-white dark:data-[state=active]:bg-slate-200 dark:data-[state=active]:text-slate-900",
  },
  {
    value: "vip",
    label: "VIP",
    icon: <Crown className="size-3.5 sm:size-4" />,
    colors: "bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70",
    activeColors: "data-[state=active]:bg-amber-500 data-[state=active]:text-white dark:data-[state=active]:bg-amber-400 dark:data-[state=active]:text-amber-950",
  },
  {
    value: "loyal",
    label: "Loyal",
    icon: <Heart className="size-3.5 sm:size-4" />,
    colors: "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70",
    activeColors: "data-[state=active]:bg-emerald-600 data-[state=active]:text-white dark:data-[state=active]:bg-emerald-400 dark:data-[state=active]:text-emerald-950",
  },
  {
    value: "at_risk",
    label: "At Risk",
    icon: <TrendingDown className="size-3.5 sm:size-4" />,
    colors: "bg-rose-50 text-rose-800 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70",
    activeColors: "data-[state=active]:bg-rose-600 data-[state=active]:text-white dark:data-[state=active]:bg-rose-400 dark:data-[state=active]:text-rose-950",
  },
  {
    value: "new",
    label: "New",
    icon: <Sparkles className="size-3.5 sm:size-4" />,
    colors: "bg-blue-50 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70",
    activeColors: "data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-400 dark:data-[state=active]:text-blue-950",
  },
  {
    value: "inactive",
    label: "Inactive",
    icon: <UserX className="size-3.5 sm:size-4" />,
    colors: "bg-violet-50 text-violet-800 hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-950/70",
    activeColors: "data-[state=active]:bg-violet-600 data-[state=active]:text-white dark:data-[state=active]:bg-violet-400 dark:data-[state=active]:text-violet-950",
  },
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

  // Segment thresholds live in Business Settings — fetched so the header
  // text always matches what the backend actually uses.
  const [segmentRules, setSegmentRules] = useState<{
    vipMinSpent: number;
    vipMinOrders: number;
    atRiskDays: number;
    newDays: number;
  } | null>(null);

  useEffect(() => {
    fetchProtectedData<{
      vipMinSpent: number;
      vipMinOrders: number;
      atRiskDays: number;
      newDays: number;
    }>("crm/segment-rules")
      .then(setSegmentRules)
      .catch(() => {});
  }, []);

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

  const [isExporting, setIsExporting] = useState(false);
  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const token = await resolveAuthToken();
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (segment !== "all") params.set("segment", segment);
      const response = await fetch(
        `${apiUrl}/crm/customers/export?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error(`Export failed: ${response.status}`);

      // Backend streams fully-quoted CSV — parse it, then wrap in a real
      // .xlsx so the download opens cleanly in Excel.
      const csv = await response.text();
      const records = parseQuotedCsv(csv);
      if (records.length === 0) throw new Error("Empty export");

      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Customers");
      for (const record of records) {
        sheet.addRow(
          record.map((value) =>
            value !== "" && !Number.isNaN(Number(value)) ? Number(value) : value
          )
        );
      }
      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.height = 20;
      for (let i = 0; i < records[0].length; i++) {
        sheet.getColumn(i + 1).width = Math.min(
          45,
          Math.max(
            8,
            ...records.map((record) => (record[i] ?? "").length + 2)
          )
        );
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `crm-customers-${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to export customers.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full">
      <PageHeader
        title="CRM Customers"
        description={
          segmentRules
            ? `Segments from order activity: VIP (${segmentRules.vipMinSpent.toLocaleString()}+ spent or ${segmentRules.vipMinOrders}+ orders), At Risk (no order in ${segmentRules.atRiskDays} days), New (joined in ${segmentRules.newDays} days), Inactive (no orders)`
            : "Segments computed from live order activity — VIP, Loyal, At Risk, New and Inactive."
        }
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
            <TabsList className="h-auto w-full justify-start gap-1.5 overflow-x-auto rounded-none bg-transparent p-0 sm:gap-2 md:w-fit">
              {SEGMENTS.map((seg) => (
                <TabsTrigger
                  key={seg.value}
                  value={seg.value}
                  className={`inline-flex h-auto flex-none items-center gap-1.5 rounded-lg border-0 px-3 py-1.5 text-xs font-semibold shadow-none transition-colors data-[state=active]:shadow-none sm:px-4 sm:py-2 sm:text-sm ${seg.colors} ${seg.activeColors}`}
                >
                  {seg.icon}
                  {seg.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <TableSearch
              wrapperClassName="flex-1 sm:w-64 sm:flex-none"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 shrink-0"
              disabled={isExporting}
              onClick={handleExportCsv}
            >
              <FileSpreadsheet className="h-4 w-4 mr-1 text-emerald-600" />
              {isExporting ? "Exporting..." : "Export Excel"}
            </Button>
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
            <Table className="min-w-205 [&_td]:py-4 [&_th]:pb-3 [&_th]:pt-0">
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead className="text-center">Orders</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                  <TableHead className="text-right">Avg Order</TableHead>
                  <TableHead>Last Order</TableHead>
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
                    <TableCell>
                      {customer.mobileNumber ? (
                        <Link
                          href={`tel:${customer.mobileNumber}`}
                          className="text-sm hover:underline"
                        >
                          {customer.mobileNumber}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.area ? (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {customer.area}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      {customer.rfm.orderCount}
                    </TableCell>
                    <TableCell className="text-right">
                      {customer.rfm.totalSpent.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {customer.rfm.averageOrderValue.toLocaleString()}
                    </TableCell>
                    <TableCell>
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
