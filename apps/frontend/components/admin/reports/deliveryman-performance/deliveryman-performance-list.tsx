"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import { ReportDateFilters } from "@/components/admin/reports/report-date-filters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ReportTablePDF } from "@/components/admin/reports/report-pdf-document";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyEnglish } from "@/lib/utils";
import { PackageCheck, Truck, Users } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

interface Summary {
  totalDeliveries: number;
  totalDeliveredValue: number;
  activeDeliveryMen: number;
}

interface DeliveryManRow {
  id: number;
  name: string;
  mobileNumber: string;
  isActive: boolean;
  deliveries: number;
  deliveredValue: number;
}

interface DeliverymanPerformanceListProps {
  fromDate?: string;
  toDate?: string;
  preset?: string;
  summary: Summary | null;
  deliveryMen: DeliveryManRow[];
}

export default function DeliverymanPerformanceList({
  fromDate,
  toDate,
  preset,
  summary,
  deliveryMen,
}: DeliverymanPerformanceListProps) {
  const router = useRouter();

  const applyParams = (params: {
    preset?: string;
    fromDate?: string;
    toDate?: string;
  }) => {
    const q = new URLSearchParams();
    if (params.preset) q.set("preset", params.preset);
    if (params.fromDate) q.set("fromDate", params.fromDate);
    if (params.toDate) q.set("toDate", params.toDate);
    router.push(`?${q.toString()}`);
  };

  const settings = useBusinessSettings();

  const pdfRows = deliveryMen.map((d) => [
    d.name,
    d.mobileNumber,
    d.isActive ? "Active" : "Inactive",
    d.deliveries,
    formatCurrencyEnglish(d.deliveredValue),
  ]);

  const pdfSummary = [
    { label: "Total Deliveries", value: String(summary?.totalDeliveries ?? 0) },
    { label: "Delivered Value", value: formatCurrencyEnglish(summary?.totalDeliveredValue ?? 0) },
    { label: "Men with Deliveries", value: String(summary?.activeDeliveryMen ?? 0) },
  ];

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Deliveryman Performance Report"
          description="Delivered orders and value per delivery man for a date range"
        />
        {deliveryMen.length > 0 && (
          <PDFDownloadLink
            document={
              <ReportTablePDF
                title="Deliveryman Performance Report"
                headers={[
                  "Name",
                  "Mobile",
                  "Status",
                  "Deliveries",
                  "Delivered Value",
                ]}
                flexes={[1.5, 1.2, 0.9, 0.9, 1.2]}
                alignRight={[3, 4]}
                rows={pdfRows}
                summary={pdfSummary}
                settings={settings}
              />
            }
            fileName={`deliveryman-performance-report-${
              new Date().toISOString().split("T")[0]
            }.pdf`}
          >
            {({ loading, error }) => (
              <Button disabled={!!error} className="bg-primaryColor hover:bg-primaryColor/90 text-white shrink-0">
                {error
                  ? "PDF Error"
                  : loading
                    ? "Generating PDF..."
                    : "Download PDF"}
              </Button>
            )}
          </PDFDownloadLink>
        )}
      </div>

      <ReportDateFilters
        preset={preset}
        fromDate={fromDate}
        toDate={toDate}
        onApply={applyParams}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard
          icon={PackageCheck}
          title="Total Deliveries"
          value={summary?.totalDeliveries ?? 0}
          bgColor="green"
        />
        <StatsCard
          icon={Truck}
          title="Delivered Value"
          value={formatCurrencyEnglish(summary?.totalDeliveredValue ?? 0)}
          bgColor="blue"
        />
        <StatsCard
          icon={Users}
          title="Delivery Men with Deliveries"
          value={summary?.activeDeliveryMen ?? 0}
          bgColor="purple"
        />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Deliveries</TableHead>
              <TableHead className="text-right">Delivered Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliveryMen.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-muted-foreground"
                >
                  No delivery men found
                </TableCell>
              </TableRow>
            ) : (
              deliveryMen.map((d) => (
                <TableRow key={d.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {d.mobileNumber}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        d.isActive
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400"
                      }
                    >
                      {d.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {d.deliveries}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrencyEnglish(d.deliveredValue)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
