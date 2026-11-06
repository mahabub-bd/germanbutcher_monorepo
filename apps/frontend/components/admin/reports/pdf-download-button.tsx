"use client";

import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";

interface PdfDownloadButtonProps {
  loading: boolean;
  error: Error | null;
}

/**
 * Compact "Download PDF" trigger shared by every report header.
 * Outline style with a red file icon, pairing with the green
 * Download Excel button beside it. Short "PDF" label on mobile
 * so the button stays narrow and beside the page title instead
 * of taking the full row width.
 */
export function PdfDownloadButton({ loading, error }: PdfDownloadButtonProps) {
  return (
    <Button
      variant="outline"
      disabled={!!error}
      className="shrink-0 gap-1.5 px-3 text-sm"
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin text-red-600" />
      ) : (
        <FileText className="size-4 text-red-600" />
      )}
      {error ? "Error" : loading ? "Generating…" : "PDF"}
    </Button>
  );
}
