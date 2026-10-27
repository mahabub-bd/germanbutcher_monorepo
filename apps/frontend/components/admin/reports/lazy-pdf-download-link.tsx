"use client";

import type { DocumentProps } from "@react-pdf/renderer";
import { PdfDownloadButton } from "@/components/admin/reports/pdf-download-button";
import { Button } from "@/components/ui/button";
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
}: LazyPdfDownloadLinkProps) {
  const [generating, setGenerating] = useState(false);
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
      onClick={() => setGenerating(true)}
      className="bg-primaryColor hover:bg-primaryColor/90 text-white shrink-0 px-3 text-sm"
    >
      <span className="sm:hidden">PDF</span>
      <span className="hidden sm:inline">Download PDF</span>
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
