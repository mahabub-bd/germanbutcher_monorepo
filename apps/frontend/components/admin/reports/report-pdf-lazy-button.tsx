"use client";

import { Button } from "@/components/ui/button";
import type { DocumentProps } from "@react-pdf/renderer";
import { FileText, Loader2 } from "lucide-react";
import { useState } from "react";

import { LazyPdfDownloadLink } from "./lazy-pdf-download-link";

interface ReportPdfLazyButtonProps<T> {
  /** Fetches the (full) row data at click time. Should cache/dedupe itself. */
  getRows: () => Promise<T>;
  /** Builds the PDF document from the fetched data. */
  buildDocument: (rows: T) => React.ReactElement<DocumentProps>;
  /** Download file name without extension. */
  fileName: string;
}

/**
 * "Download PDF" button for reports with a CUSTOM PDF document that needs
 * row data fetched at click time (standard-table reports should use
 * ReportPdfButton instead). Flow: click → getRows() → auto-start download
 * of buildDocument(rows). This is the shared glue that pages previously
 * hand-rolled around LazyPdfDownloadLink.
 */
export function ReportPdfLazyButton<T>({
  getRows,
  buildDocument,
  fileName,
}: ReportPdfLazyButtonProps<T>) {
  const [rows, setRows] = useState<T | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);

  const prepare = async () => {
    setIsPreparing(true);
    try {
      setRows(await getRows());
    } catch {
      // Fetchers report their own errors (toast/console).
    } finally {
      setIsPreparing(false);
    }
  };

  if (isPreparing) {
    return (
      <Button variant="outline" disabled className="shrink-0 gap-1.5 px-3 text-sm">
        <Loader2 className="size-4 animate-spin text-red-600" />
        Preparing…
      </Button>
    );
  }
  if (!rows) {
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
      document={buildDocument(rows)}
      fileName={`${fileName}-${new Date().toISOString().split("T")[0]}.pdf`}
    />
  );
}
