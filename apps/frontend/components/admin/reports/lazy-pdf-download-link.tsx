"use client";

import type { DocumentProps } from "@react-pdf/renderer";
import { PdfDownloadButton } from "@/components/admin/reports/pdf-download-button";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

interface LazyPdfDownloadLinkProps {
  /** The PDF document element. Only rendered after the user clicks. */
  document: React.ReactElement<DocumentProps>;
  fileName: string;
  /** Start generating on mount — used when row data was already loaded. */
  autoStart?: boolean;
}

/**
 * "Download PDF" trigger that defers PDF generation to the click.
 *
 * PDFDownloadLink builds the whole PDF blob as soon as it mounts, so
 * mounting it on page load (the old pattern) froze every report page.
 * Here the button renders plain until clicked; only then is
 * PDFDownloadLink mounted and the document generated. The finished
 * download is auto-clicked once, after which the inner button keeps
 * working as a normal download link (re-clicks reuse the same blob).
 */
export function LazyPdfDownloadLink({
  document: pdfDocument,
  fileName,
  autoStart = false,
}: LazyPdfDownloadLinkProps) {
  const [generating, setGenerating] = useState(autoStart);
  const downloaded = useRef(false);

  return generating ? (
    <PDFDownloadLink document={pdfDocument} fileName={fileName}>
      {({ loading, error, url }) => (
        <AutoDownload
          loading={loading}
          error={error}
          url={url ?? null}
          fileName={fileName}
          downloaded={downloaded}
        />
      )}
    </PDFDownloadLink>
  ) : (
    <Button
      variant="outline"
      onClick={() => setGenerating(true)}
      className="shrink-0 gap-1.5 px-3 text-sm"
    >
      <FileText className="size-4 text-red-600" />
      PDF
    </Button>
  );
}

/** Shows progress and auto-triggers the browser download when the blob is ready. */
function AutoDownload({
  loading,
  error,
  url,
  fileName,
  downloaded,
}: {
  loading: boolean;
  error: Error | null;
  url: string | null;
  fileName: string;
  downloaded: React.MutableRefObject<boolean>;
}) {
  useEffect(() => {
    if (!url || downloaded.current) return;
    downloaded.current = true;
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    window.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }, [url, fileName, downloaded]);

  return <PdfDownloadButton loading={loading} error={error} />;
}
