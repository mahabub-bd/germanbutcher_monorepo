"use client";

import { Button } from "@/components/ui/button";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import { DateRangePreset } from "@/common/enums";
import { FileSpreadsheet } from "lucide-react";

interface ReportExcelButtonProps {
  title: string;
  /** e.g. "Period: 2026-10-01 to 2026-10-10" — shown under the title. */
  subtitle?: string;
  headers: string[];
  /** Pre-formatted cell values, aligned with `headers`. */
  rows: (string | number)[][];
  /** Optional key/value summary appended below the table. */
  summary?: { label: string; value: string }[];
  fileName: string;
  disabled?: boolean;
}

const PRESET_LABELS: Record<string, string> = {
  [DateRangePreset.TODAY]: "Today",
  [DateRangePreset.THIS_WEEK]: "This Week",
  [DateRangePreset.LAST_WEEK]: "Last Week",
  [DateRangePreset.THIS_MONTH]: "This Month",
  [DateRangePreset.LAST_MONTH]: "Last Month",
  [DateRangePreset.LAST_3_MONTHS]: "Last 3 Months",
  [DateRangePreset.LAST_6_MONTHS]: "Last 6 Months",
  [DateRangePreset.LAST_YEAR]: "Last Year",
  [DateRangePreset.THIS_YEAR]: "This Year",
};

/** Human-readable period line for report exports. */
export function dateRangeSubtitle(
  preset?: string,
  fromDate?: string,
  toDate?: string
): string {
  if (preset) return `Period: ${PRESET_LABELS[preset] ?? preset}`;
  if (fromDate && toDate) return `Period: ${fromDate} to ${toDate}`;
  if (fromDate) return `Period: from ${fromDate}`;
  if (toDate) return `Period: up to ${toDate}`;
  return "Period: All time";
}

const BORDER_COLOR = "FFD1D5DB"; // gray-300
const HEADER_FILL = "FF8B0000"; // dark red, matches the report PDF theme
const ALT_ROW_FILL = "FFF9FAFB"; // gray-50

/**
 * "Download Excel" trigger shared by every report header. Builds a styled
 * .xlsx (via exceljs, loaded on demand) with the company name/address from
 * Business Settings, the title + period line, a bordered table and the
 * summary rows — mirroring the report PDF layout.
 */
export function ReportExcelButton({
  title,
  subtitle,
  headers,
  rows,
  summary,
  fileName,
  disabled = false,
}: ReportExcelButtonProps) {
  const settings = useBusinessSettings();

  if (disabled || rows.length === 0) return null;

  const handleDownload = async () => {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(title.slice(0, 31));

    const colCount = headers.length;
    const thin = {
      style: "thin" as const,
      color: { argb: BORDER_COLOR },
    };
    const bordered = {
      top: thin,
      left: thin,
      bottom: thin,
      right: thin,
    };

    let rowIndex = 1;

    // --- Company block ---
    const businessName = settings?.businessName?.trim();
    const address = settings?.address?.trim();
    const phone = settings?.phone?.trim();
    if (businessName) {
      const row = sheet.getRow(rowIndex++);
      row.getCell(1).value = businessName;
      row.getCell(1).font = { bold: true, size: 14 };
      sheet.mergeCells(1, 1, 1, colCount);
    }
    if (address || phone) {
      const row = sheet.getRow(rowIndex++);
      row.getCell(1).value = [address, phone].filter(Boolean).join(" | ");
      row.getCell(1).font = { size: 10, color: { argb: "FF6B7280" } };
      sheet.mergeCells(rowIndex - 1, 1, rowIndex - 1, colCount);
    }

    // --- Title + period ---
    const titleRow = sheet.getRow(rowIndex++);
    titleRow.getCell(1).value = title;
    titleRow.getCell(1).font = { bold: true, size: 12 };
    sheet.mergeCells(titleRow.number, 1, titleRow.number, colCount);

    if (subtitle) {
      const row = sheet.getRow(rowIndex++);
      row.getCell(1).value = subtitle;
      row.getCell(1).font = {
        italic: true,
        size: 10,
        color: { argb: "FF6B7280" },
      };
      sheet.mergeCells(row.number, 1, row.number, colCount);
    }

    rowIndex++; // spacer before the table

    // --- Table header ---
    const headerRow = sheet.getRow(rowIndex++);
    headers.forEach((header, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
      cell.border = bordered;
      cell.alignment = { vertical: "middle" };
    });
    headerRow.height = 20;

    // --- Data rows (borders + alternating shading, like the PDF) ---
    for (let r = 0; r < rows.length; r++) {
      const row = sheet.getRow(rowIndex++);
      rows[r].forEach((value, i) => {
        const cell = row.getCell(i + 1);
        cell.value = value;
        cell.border = bordered;
        if (r % 2 === 1) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: ALT_ROW_FILL },
          };
        }
      });
    }

    // --- Summary rows ---
    if (summary && summary.length > 0) {
      rowIndex++; // spacer
      for (const item of summary) {
        const row = sheet.getRow(rowIndex++);
        const label = row.getCell(1);
        label.value = item.label;
        label.font = { bold: true };
        const value = row.getCell(2);
        value.value = item.value;
        value.font = { bold: true, color: { argb: "FF8B0000" } };
      }
    }

    // Rough auto-width: longest cell value per column, capped.
    for (let i = 1; i <= colCount; i++) {
      const values = [headers[i - 1] ?? ""];
      for (const row of rows) values.push(String(row[i - 1] ?? ""));
      const width = Math.min(
        45,
        Math.max(8, ...values.map((v) => v.length + 2))
      );
      sheet.getColumn(i).width = width;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${fileName}-${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      variant="outline"
      onClick={handleDownload}
      className="shrink-0 gap-1.5 px-3 text-sm"
    >
      <FileSpreadsheet className="size-4 text-emerald-600" />
      <span className="sm:hidden">Excel</span>
      <span className="hidden sm:inline">Download Excel</span>
    </Button>
  );
}
