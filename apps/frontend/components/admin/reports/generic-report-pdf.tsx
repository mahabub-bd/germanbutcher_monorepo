"use client";

import { Button } from "@/components/ui/button";
import { fetchData } from "@/utils/api-utils";
import type { BusinessSettings } from "@/utils/types";
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { LazyPdfDownloadLink } from "./lazy-pdf-download-link";
import { ReportExportData } from "./download-excel-button";
import { ReportPDFHeader } from "./report-pdf-header";

// The built-in Helvetica has no Bangla glyphs, so customer names/messages and
// even ৳ render as broken boxes. Noto Sans Bengali covers Bangla + basic
// Latin, and is served from /font so it also works offline.
if (typeof window !== "undefined") {
  Font.register({
    family: "NotoSansBengali",
    fonts: [
      { src: "/font/NotoSansBengali-Regular.ttf" },
      { src: "/font/NotoSansBengali-Bold.ttf", fontWeight: 700 },
    ],
  });
}

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
  /** Wide tables (e.g. the 11-column ticket export) use landscape A4. */
  orientation?: "portrait" | "landscape";
}

// ৳ is not rendered by @react-pdf's built-in fonts, so use the ASCII "BDT"
// prefix in cell values passed in.

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "NotoSansBengali",
    color: "#111",
  },
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
  // Right padding keeps neighbouring columns from butting into each other
  // (e.g. Mobile text running straight into Order Ref).
  cell: { fontSize: 8, fontWeight: 400, paddingRight: 6 },
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
  orientation = "portrait",
}: GenericReportPDFProps) {
  return (
    <Document>
      <Page size="A4" orientation={orientation} style={styles.page}>
        <ReportPDFHeader settings={settings} />
        <Text style={styles.reportTitle}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        {/* Table container wraps: long exports split across pages and the
            fixed header row repeats. Rows themselves stay unsplit. */}
        <View style={styles.table}>
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
                    fontSize: 8,
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
  rows?: (string | number)[][];
  /** Lazy alternative to `rows`: fetched when the button is clicked. */
  getRows?: () => Promise<ReportExportData>;
  summary?: ReportPdfSummaryItem[];
  /** Download file name without extension. */
  fileName: string;
  /** Hide the button when there is no data (default: only render with rows). */
  disabled?: boolean;
  /** Wide tables use landscape A4 (default portrait). */
  orientation?: "portrait" | "landscape";
}

/**
 * Reusable "Download PDF" button for admin report pages. Builds a
 * GenericReportPDF from plain columns/rows — no per-report PDF component
 * required. Renders nothing while the page still loads or there is no data.
 *
 * With `getRows`, row data is fetched at click time (a spinner replaces the
 * button while loading) and the download starts as soon as the PDF is built.
 */
export function ReportPdfButton({
  title,
  subtitle,
  columns,
  rows,
  getRows,
  summary,
  fileName,
  disabled = false,
  orientation = "portrait",
}: ReportPdfButtonProps) {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [lazyData, setLazyData] = useState<ReportExportData | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Public endpoint — same source the storefront header/footer use.
    fetchData<BusinessSettings>("business-settings")
      .then(setSettings)
      .catch(() => undefined);
  }, []);

  const prepare = async () => {
    if (!getRows) return;
    setIsPreparing(true);
    try {
      setLazyData(await getRows());
    } finally {
      setIsPreparing(false);
    }
  };

  if (!mounted || disabled) return null;

  // Lazy mode: click → fetch rows → mount the (auto-started) PDF link.
  if (getRows) {
    if (isPreparing) {
      return (
        <Button
          variant="outline"
          disabled
          className="shrink-0 gap-1.5 px-3 text-sm"
        >
          <Loader2 className="size-4 animate-spin text-red-600" />
          Preparing…
        </Button>
      );
    }
    if (!lazyData) {
      return (
        <Button
          variant="outline"
          onClick={prepare}
          className="shrink-0 gap-1.5 px-3 text-sm"
        >
          <FileText className="size-4 text-red-600" />
          PDF
        </Button>
      );
    }
    return (
      <LazyPdfDownloadLink
        autoStart
        document={
          <GenericReportPDF
            title={title}
            subtitle={subtitle}
            settings={settings}
            columns={columns}
            rows={lazyData.rows}
            summary={lazyData.summary}
            orientation={orientation}
          />
        }
        fileName={`${fileName}-${new Date().toISOString().split("T")[0]}.pdf`}
      />
    );
  }

  if (!rows || rows.length === 0) return null;

  return (
    <LazyPdfDownloadLink
      document={
        <GenericReportPDF
          title={title}
          subtitle={subtitle}
          settings={settings}
          columns={columns}
          rows={rows}
          summary={summary}
          orientation={orientation}
        />
      }
      fileName={`${fileName}-${new Date().toISOString().split("T")[0]}.pdf`}
    />
  );
}
