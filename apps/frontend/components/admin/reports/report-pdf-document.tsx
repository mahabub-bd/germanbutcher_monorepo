"use client";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import { ReportPDFHeader } from "./report-pdf-header";
import type { BusinessSettings } from "@/utils/types";

/**
 * Generic table-based report PDF in the same visual style as the order
 * report PDF (shared header from Business Settings, dark-red table header,
 * alternating rows, summary boxes, footer). One component serves all the
 * simple tabular reports.
 */

interface Props {
  title: string;
  headers: string[];
  /** Flex weights per column; defaults to equal widths. */
  flexes?: number[];
  /** Column indexes rendered right-aligned (numeric columns). */
  alignRight?: number[];
  rows: (string | number)[][];
  summary?: { label: string; value: string }[];
  settings?: BusinessSettings | null;
}

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: "Helvetica", color: "#111" },

  // ----- Header -----
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
    marginBottom: 8,
  },

  // ----- Table -----
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
  tableHeaderText: {
    flex: 1,
    fontWeight: "bold",
    fontSize: 9,
    textAlign: "left",
  },
  row: {
    flexDirection: "row",
    borderBottom: 1,
    borderColor: "#f3f4f6",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  altRow: { backgroundColor: "#f9fafb" },
  cell: {
    flex: 1,
    textAlign: "left",
    fontSize: 8.5,
  },

  // ----- Summary -----
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

  // ----- Footer -----
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
  footerHighlight: { color: "#8B0000", fontWeight: "bold" },
});

export function ReportTablePDF({
  title,
  headers,
  flexes,
  alignRight = [],
  rows,
  summary,
  settings,
}: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ReportPDFHeader settings={settings} styles={styles} />

        <Text style={styles.reportTitle}>{title}</Text>

        <View style={styles.tableHeader} wrap={false}>
          {headers.map((header, i) => (
            <Text
              key={header}
              style={[
                styles.tableHeaderText,
                { flex: flexes?.[i] ?? 1 },
                alignRight.includes(i) ? { textAlign: "right" } : {},
              ]}
            >
              {header}
            </Text>
          ))}
        </View>

        {rows.map((row, rowIndex) => (
          <View
            key={rowIndex}
            style={[styles.row, rowIndex % 2 === 0 ? styles.altRow : {}]}
            wrap={false}
          >
            {row.map((cellValue, colIndex) => (
              <Text
                key={colIndex}
                style={[
                  styles.cell,
                  { flex: flexes?.[colIndex] ?? 1 },
                  alignRight.includes(colIndex) ? { textAlign: "right" } : {},
                ]}
              >
                {cellValue}
              </Text>
            ))}
          </View>
        ))}

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

        <View style={styles.footer}>
          <Text>
            Generated on{" "}
            {new Date().toLocaleString("en-BD", {
              dateStyle: "medium",
              timeStyle: "short",
            })}{" "}
            | © {new Date().getFullYear()}{" "}
            <Text style={styles.footerHighlight}>German Butcher</Text> — All
            Rights Reserved
          </Text>
        </View>
      </Page>
    </Document>
  );
}
