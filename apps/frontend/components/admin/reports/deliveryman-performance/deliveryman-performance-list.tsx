"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import { ReportExcelButton, dateRangeSubtitle } from "@/components/admin/reports/download-excel-button";
import { LazyPdfDownloadLink } from "@/components/admin/reports/lazy-pdf-download-link";
import { ReportDateFilters } from "@/components/admin/reports/report-date-filters";
import { ReportTablePDF } from "@/components/admin/reports/report-pdf-document";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import { formatCurrencyEnglish } from "@/lib/utils";
import { ClipboardList, PackageCheck, Truck, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface Summary {
  totalAssigned: number;
  totalDeliveries: number;
  totalDeliveredValue: number;
  activeDeliveryMen: number;
}

interface DeliveryManRow {
  id: number;
  name: string;
  mobileNumber: string;
  isActive: boolean;
  assigned: number;
  deliveries: number;
  inProgress: number;
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
    d.assigned,
    d.inProgress,
    d.deliveries,
    formatCurrencyEnglish(d.deliveredValue),
  ]);

  const pdfSummary = [
    { label: "Total Assigned", value: String(summary?.totalAssigned ?? 0) },
    { label: "Total Deliveries", value: String(summary?.totalDeliveries ?? 0) },
    { label: "Delivered Value", value: formatCurrencyEnglish(summary?.totalDeliveredValue ?? 0) },
    { label: "Men with Deliveries", value: String(summary?.activeDeliveryMen ?? 0) },
  ];

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Deliveryman Performance Report"
        />
        {deliveryMen.length > 0 && (
          <div className="flex shrink-0 gap-2">
            <ReportExcelButton
              title="Deliveryman Performance Report"
              subtitle={dateRangeSubtitle(preset, fromDate, toDate)}
                            headers={["Name", "Mobile", "Status", "Assigned", "In Progress", "Deliveries", "Delivered Value"]}
              rows={pdfRows}
              summary={pdfSummary}
              fileName="deliveryman-performance-report"
            />
            <LazyPdfDownloadLink
            document={
              <ReportTablePDF
                title="Deliveryman Performance Report"
                headers={[
                  "Name",
                  "Mobile",
                  "Status",
                  "Assigned",
                  "In Progress",
                  "Deliveries",
                  "Delivered Value",
                ]}
                flexes={[1.5, 1.2, 0.9, 0.9, 0.9, 0.9, 1.2]}
                alignRight={[3, 4, 5, 6]}
                rows={pdfRows}
                summary={pdfSummary}
                settings={settings}
              />
            }
            fileName={`deliveryman-performance-report-${new Date().toISOString().split("T")[0]
              }.pdf`}
           />
          </div>
        )}
      </div>

      <ReportDateFilters
        preset={preset}
        fromDate={fromDate}
        toDate={toDate}
        onApply={applyParams}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatsCard
          icon={ClipboardList}
          title="Assigned Orders"
          value={summary?.totalAssigned ?? 0}
          bgColor="blue"
        />
        <StatsCard
          icon={Truck}
          title="In Progress"
          value={summary ? summary.totalAssigned - summary.totalDeliveries : 0}
          bgColor="orange"
        />
        <StatsCard
          icon={PackageCheck}
          title="Total Deliveries"
          value={summary?.totalDeliveries ?? 0}
          bgColor="green"
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
              <TableHead className="text-right">Assigned</TableHead>
              <TableHead className="text-right">In Progress</TableHead>
              <TableHead className="text-right">Delivered</TableHead>
              <TableHead className="text-right">Delivered Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliveryMen.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
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
                    {d.assigned}
                  </TableCell>
                  <TableCell className="text-right">
                    {d.inProgress}
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
