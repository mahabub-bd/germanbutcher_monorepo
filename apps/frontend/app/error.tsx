"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-4 text-center">
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-amber-100 p-4">
            <AlertTriangle className="h-10 w-10 text-amber-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold tracking-tight">
          Something went wrong
        </h2>

        <div className="text-muted-foreground">
          <p>
            We encountered an error while loading this page. Please try again
            later.
          </p>
          {error.digest && (
            <p className="mt-2 text-xs text-muted-foreground">
              Error ID:{" "}
              <code className="rounded bg-muted px-1 py-0.5">
                {error.digest}
              </code>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Go to Homepage
            </Link>
          </Button>
          <Button variant="ghost" asChild className="gap-2">
            <Link href="javascript:history.back()">
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Link>
          </Button>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            If this problem persists,{" "}
            <Link
              href="/contact"
              className="font-medium text-primary hover:underline"
            >
              contact our support team
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
