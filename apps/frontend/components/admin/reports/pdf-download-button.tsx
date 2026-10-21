"use client";

import { Button } from "@/components/ui/button";

interface PdfDownloadButtonProps {
  loading: boolean;
  error: Error | null;
}

/**
 * Compact "Download PDF" trigger shared by every report header.
 * Short "PDF" label on mobile so the button stays narrow and
 * beside the page title instead of taking the full row width.
 */
export function PdfDownloadButton({ loading, error }: PdfDownloadButtonProps) {
  return (
    <Button
      disabled={!!error}
      className="bg-primaryColor hover:bg-primaryColor/90 text-white shrink-0 px-3 text-sm"
    >
      <span className="sm:hidden">{error ? "Error" : loading ? "…" : "PDF"}</span>
      <span className="hidden sm:inline">
        {error ? "PDF Error" : loading ? "Generating PDF..." : "Download PDF"}
      </span>
    </Button>
  );
}
