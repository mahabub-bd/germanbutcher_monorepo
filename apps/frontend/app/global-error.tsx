"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RefreshCw, Wifi, WifiOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isOnline, setIsOnline] = useState(true);
  const [errorType, setErrorType] = useState<"network" | "server" | "unknown">(
    "unknown"
  );

  useEffect(() => {
    if (
      error.message.includes("fetch failed") ||
      error.message.includes("network") ||
      !navigator.onLine
    ) {
      setErrorType("network");
      setIsOnline(false);
    } else if (
      error.message.includes("500") ||
      error.message.includes("server")
    ) {
      setErrorType("server");
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [error]);

  const handleRetry = () => {
    reset();
  };

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
          <div className="mx-auto max-w-md space-y-6">
            <div className="flex justify-center">
              {errorType === "network" ? (
                <div className="rounded-full bg-red-100 p-4">
                  <WifiOff className="h-12 w-12 text-red-600" />
                </div>
              ) : (
                <div className="rounded-full bg-amber-100 p-4">
                  <AlertTriangle className="h-12 w-12 text-amber-600" />
                </div>
              )}
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {errorType === "network"
                ? "Connection Error"
                : errorType === "server"
                ? "Server Error"
                : "Something went wrong"}
            </h1>

            <div className="text-muted-foreground">
              {errorType === "network" ? (
                <p>
                  We can&apos;t connect to our servers. Please check your
                  internet connection and try again.
                  {!isOnline && (
                    <span className="block mt-2 font-medium text-red-600">
                      You are currently offline.
                    </span>
                  )}
                </p>
              ) : errorType === "server" ? (
                <p>
                  Our servers are experiencing issues right now. We&apos;ve been
                  notified and are working on a fix. Please try again later.
                </p>
              ) : (
                <p>
                  An unexpected error has occurred. We&apos;ve been notified and
                  are looking into the issue. Please try again later.
                </p>
              )}
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
              <Button onClick={handleRetry} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                {isOnline ? "Try Again" : "Retry When Online"}
              </Button>
              <Button variant="outline" asChild className="gap-2">
                <Link href="/">
                  <Home className="h-4 w-4" />
                  Go to Homepage
                </Link>
              </Button>
            </div>

            {errorType === "network" && (
              <div
                className={`mt-4 flex items-center justify-center gap-2 text-sm ${
                  isOnline ? "text-green-600" : "text-red-600"
                }`}
              >
                {isOnline ? (
                  <Wifi className="h-4 w-4" />
                ) : (
                  <WifiOff className="h-4 w-4" />
                )}
                <span>
                  {isOnline ? "You're back online" : "You're offline"}
                </span>
              </div>
            )}

            <div className="mt-6 text-sm text-muted-foreground">
              <p>
                Need help?{" "}
                <Link
                  href="/contact"
                  className="font-medium text-primary hover:underline"
                >
                  Contact Support
                </Link>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
