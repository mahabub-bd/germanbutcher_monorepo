"use client";

import { Eye, Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

interface ProductFormFooterProps {
  mode: "create" | "edit";
  isSubmitting: boolean;
  onCancel: () => void;
  previewHref?: string;
}

export function ProductFormFooter({
  mode,
  isSubmitting,
  onCancel,
  previewHref,
}: ProductFormFooterProps) {
  return (
    <div className="sticky bottom-0 z-10 mt-6 border-t bg-background/95 px-2 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center justify-between gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex items-center gap-3">
          {previewHref ? (
            <Button asChild variant="outline" type="button">
              <Link href={previewHref} target="_blank">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Link>
            </Button>
          ) : (
            <Button variant="outline" type="button" disabled>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "create" ? "Creating..." : "Updating..."}
              </>
            ) : mode === "create" ? (
              "Create Product"
            ) : (
              "Update Product"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
