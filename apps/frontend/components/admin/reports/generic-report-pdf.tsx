"use client";

import { Button } from "@/components/ui/button";
import { fetchData } from "@/utils/api-utils";
import type { BusinessSettings } from "@/utils/types";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import { ReportPDFHeader } from "./report-pdf-header";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

export interface ReportPdfColumn {
  header: string;
  /** Relative width weight (default 1). */
  width?: number;
  align?: "left" | "right" | "center";
}

export interface ReportPdfSummaryItem {
  label: string;
  value: string;
}

interface GenericReportPDFProps {
  title: string;
  /** e.g. "Period: 2026-10-01 to 2026-10-10" */
  subtitle?: string;
  settings?: BusinessSettings | null;
  columns: ReportPdfColumn[];
  /** Rendered cell values, aligned with `columns`. */
  rows: (string | number)[][];
  /** Optional key/value summary blocks under the table. */
  summary?: ReportPdfSummaryItem[];
}

// ৳ is not rendered by @react-pdf's built-in fonts, so use the ASCII "BDT"
// prefix in cell values passed in.

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: "Helvetica", color: "#111" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: 1,
    borderColor: "#8B0000",
    paddingBottom: 10,
    marginBottom: 10,
  },
  logo: { width: 55, height: 55 },
  companyInfo: { flexDirection: "column" },
  companyName: { fontSize: 14, fontWeight: "bold", color: "#8B0000" },
  companyAddress: { fontSize: 9, marginTop: 2 },
  reportTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#8B0000",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 10,
  },
  table: {
    width: "100%",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#8B0000",
    color: "#fff",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: "row",
    borderBottom: 1,
    borderColor: "#f3f4f6",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  altRow: { backgroundColor: "#f9fafb" },
  cell: { fontSize: 8.5 },
  summarySection: {
    marginTop: 15,
    paddingTop: 10,
    borderTop: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryBox: { textAlign: "center" },
  summaryLabel: { fontSize: 9, color: "#555" },
  summaryValue: { fontSize: 12, fontWeight: "bold", color: "#8B0000" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    borderTop: 1,
    borderColor: "#e5e7eb",
    paddingTop: 5,
    textAlign: "center",
    fontSize: 8,
    color: "#6b7280",
  },
});

/**
 * Table-style report PDF shared by all admin reports. Takes plain column
 * definitions and pre-formatted row values — no per-report document needed.
 */
export function GenericReportPDF({
  title,
  subtitle,
  settings,
  columns,
  rows,
  summary,
}: GenericReportPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ReportPDFHeader settings={settings} styles={styles} />
        <Text style={styles.reportTitle}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        <View style={styles.table} wrap={false}>
          {/* Header row */}
          <View style={styles.tableHeader} fixed>
            {columns.map((col) => (
              <Text
                key={col.header}
                style={[
                  styles.cell,
                  {
                    flex: col.width ?? 1,
                    fontWeight: "bold",
                    fontSize: 9,
                    color: "#fff",
                    textAlign: col.align ?? "left",
                  },
                ]}
              >
                {col.header}
              </Text>
            ))}
          </View>

          {rows.map((row, rowIndex) => (
            <View
              key={rowIndex}
              style={[styles.row, ...(rowIndex % 2 === 1 ? [styles.altRow] : [])]}
              wrap={false}
            >
              {row.map((cell, colIndex) => (
                <Text
                  key={colIndex}
                  style={[
                    styles.cell,
                    {
                      flex: columns[colIndex]?.width ?? 1,
                      textAlign: columns[colIndex]?.align ?? "left",
                    },
                  ]}
                >
                  {String(cell ?? "")}
                </Text>
              ))}
            </View>
          ))}
        </View>

        {summary && summary.length > 0 ? (
          <View style={styles.summarySection}>
            {summary.map((item) => (
              <View key={item.label} style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>{item.label}</Text>
                <Text style={styles.summaryValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.footer}>
          Generated on {new Date().toLocaleString()} —{" "}
          <Text style={{ color: "#8B0000", fontWeight: "bold" }}>
            {settings?.businessName?.trim() || "German Butcher"}
          </Text>
        </Text>
      </Page>
    </Document>
  );
}

interface ReportPdfButtonProps {
  /** PDF document title, shown under the company header. */
  title: string;
  /** Date-range/period line under the title. */
  subtitle?: string;
  columns: ReportPdfColumn[];
  rows: (string | number)[][];
  summary?: ReportPdfSummaryItem[];
  /** Download file name without extension. */
  fileName: string;
  /** Hide the button when there is no data (default: only render with rows). */
  disabled?: boolean;
}

/**
 * Reusable "Download PDF" button for admin report pages. Builds a
 * GenericReportPDF from plain columns/rows — no per-report PDF component
 * required. Renders nothing while the page still loads or there is no data.
 */
export function ReportPdfButton({
  title,
  subtitle,
  columns,
  rows,
  summary,
  fileName,
  disabled = false,
}: ReportPdfButtonProps) {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);

  useEffect(() => {
    setMounted(true);
    // Public endpoint — same source the storefront header/footer use.
    fetchData<BusinessSettings>("business-settings")
      .then(setSettings)
      .catch(() => undefined);
  }, []);

  if (!mounted || disabled || rows.length === 0) return null;

  return (
    <PDFDownloadLink
      document={
        <GenericReportPDF
          title={title}
          subtitle={subtitle}
          settings={settings}
          columns={columns}
          rows={rows}
          summary={summary}
        />
      }
      fileName={`${fileName}-${new Date().toISOString().split("T")[0]}.pdf`}
    >
      {({ loading, error }) => (
        <Button
          disabled={!!error}
          className="bg-primaryColor hover:bg-primaryColor/90 text-white w-full sm:w-auto shrink-0"
        >
          {error ? "PDF Error" : loading ? "Generating PDF..." : "Download PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
