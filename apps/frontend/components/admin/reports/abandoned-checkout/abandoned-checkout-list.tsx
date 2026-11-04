"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import { ReportExcelButton } from "@/components/admin/reports/download-excel-button";
import { LazyPdfDownloadLink } from "@/components/admin/reports/lazy-pdf-download-link";
import { ReportTablePDF } from "@/components/admin/reports/report-pdf-document";
import { PaginationComponent } from "@/components/common/pagination";
import { PillBadge } from "@/components/common/pill-badge";
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
import { useBusinessSettings } from "@/hooks/use-business-settings";
import { formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import { ShoppingCart, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

interface AbandonedCartRow {
  cartId: number;
  userName: string | null;
  mobileNumber: string | null;
  itemCount: number;
  value: number;
  updatedAt: string;
}

interface Summary {
  abandonedCarts: number;
  abandonedValue: number;
}

interface AbandonedCheckoutListProps {
  page: number;
  search?: string;
  total: number;
  totalPages: number;
  summary: Summary | null;
  items: AbandonedCartRow[];
}

/** Whole amounts only — report values never need decimal places. */
const bare = (value: number) => formatCurrencyEnglish(value || 0, 0);
/** Cards carry the ৳ mark; desktop cells rely on the header note instead. */
const amount = (value: number) => `৳${bare(value)}`;
/** @react-pdf's built-in fonts have no ৳ glyph, so exports use "BDT ". */
const formatMoney = (value: number) =>
  `BDT ${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

export default function AbandonedCheckoutList({
  page,
  search,
  total,
  totalPages,
  summary,
  items,
}: AbandonedCheckoutListProps) {
  const router = useRouter();
  const settings = useBusinessSettings();
  const [mounted, setMounted] = useState(false);
  const [, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(search || "");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchInput.trim();
    startTransition(() =>
      router.push(term ? `?search=${encodeURIComponent(term)}` : "?")
    );
  };

  const handlePageChange = (newPage: number) => {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    qs.set("page", String(newPage));
    startTransition(() => router.push(`?${qs.toString()}`));
  };

  const hasData = items.length > 0;

  const exportRows: (string | number)[][] = items.map((row) => [
    row.userName || "Guest",
    row.mobileNumber || "",
    row.itemCount,
    formatMoney(row.value),
    formatDateTime(row.updatedAt),
  ]);

  const pdfSummary = [
    { label: "Abandoned Carts", value: String(summary?.abandonedCarts ?? 0) },
    {
      label: "Abandoned Value",
      value: formatMoney(summary?.abandonedValue ?? 0),
    },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Abandoned Checkout Report"
        description="Carts with items left untouched for over 24 hours whose customer never checked out."
      >
        {mounted && hasData && (
          <>
            <ReportExcelButton
              title="Abandoned Checkout Report"
              subtitle="Carts untouched for 24h+, never checked out"
              headers={[
                "Customer",
                "Mobile",
                "Items",
                "Cart Value",
                "Last Activity",
              ]}
              rows={exportRows}
              summary={pdfSummary}
              fileName="abandoned-checkout-report"
            />
            <LazyPdfDownloadLink
              document={
                <ReportTablePDF
                  title="Abandoned Checkout Report"
                  headers={[
                    "Customer",
                    "Mobile",
                    "Items",
                    "Cart Value",
                    "Last Activity",
                  ]}
                  flexes={[1.5, 1.2, 0.7, 1, 1.3]}
                  alignRight={[2, 3]}
                  rows={exportRows}
                  summary={pdfSummary}
                  settings={settings}
                />
              }
              fileName={`abandoned-checkout-report-${new Date()
                .toISOString()
                .split("T")[0]}.pdf`}
            />
          </>
        )}
      </PageHeader>

      {/* Search bar — no date filters; abandoned carts are an ongoing state */}
      <form
        onSubmit={handleSearch}
        className="mb-4 flex w-full items-center gap-2"
      >
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search customer name or mobile"
          className="max-w-md"
        />
        <Button type="submit" disabled={false}>
          Search
        </Button>
      </form>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <ShoppingCart className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">No abandoned carts right now</p>
            <p className="text-xs text-muted-foreground">
              Carts untouched for 24h+ appear here.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary totals */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <StatsCard
              icon={ShoppingCart}
              title="Abandoned carts"
              value={(summary?.abandonedCarts ?? 0).toLocaleString("en-US")}
              description="Carts untouched for over 24 hours"
              bgColor="orange"
            />
            <StatsCard
              icon={Wallet}
              title="Abandoned value"
              value={amount(summary?.abandonedValue ?? 0)}
              description="Total value sitting in abandoned carts"
              bgColor="red"
            />
          </div>

          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">Abandoned carts</h3>
                <p className="text-xs text-muted-foreground">
                  Amounts in ৳ · most recently touched first
                </p>
              </div>
              <PillBadge className="font-medium tabular-nums">
                {items.length} rows
              </PillBadge>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <Table className="report-table">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Customer</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead className="text-right">Cart Value</TableHead>
                    <TableHead className="text-right">Last Activity</TableHead>
                    <TableHead className="pr-4 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((row) => (
                    <TableRow key={row.cartId}>
                      <TableCell className="py-2 pl-4">
                        <span className="text-sm font-semibold">
                          {row.userName || "Guest"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {row.mobileNumber ? (
                          <a
                            href={`tel:${row.mobileNumber}`}
                            className="text-sm whitespace-nowrap text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {row.mobileNumber}
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No mobile
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {row.itemCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {bare(row.value)}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {formatDateTime(row.updatedAt)}
                        </span>
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/admin/crm/abandoned-carts">Details</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards: one card per cart */}
            <div className="divide-y md:hidden">
              {items.map((row) => (
                <article key={row.cartId} className="space-y-2 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {row.userName || "Guest"}
                      </p>
                      {row.mobileNumber && (
                        <a
                          href={`tel:${row.mobileNumber}`}
                          className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {row.mobileNumber}
                        </a>
                      )}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/admin/crm/abandoned-carts">Details</Link>
                    </Button>
                  </div>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {row.itemCount} item{row.itemCount === 1 ? "" : "s"} ·{" "}
                    {bare(row.value)} · {formatDateTime(row.updatedAt)}
                  </p>
                </article>
              ))}
            </div>

            {/* Footer: what the list covers */}
            <div className="border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Showing page {page} of {totalPages} ·{" "}
                {total.toLocaleString("en-US")} cart
                {total === 1 ? "" : "s"} in total
              </p>
            </div>
          </div>

          <div className="mt-4">
            <PaginationComponent
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}
    </div>
  );
}
