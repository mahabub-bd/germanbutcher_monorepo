"use client";

import { UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type React from "react";

interface AuthShellProps {
  logoUrl?: string;
  businessName?: string;
  subtitle: string;
  children: React.ReactNode;
  /** Link block shown in the card's footer strip */
  footer: React.ReactNode;
  /** Optional content below the card (e.g. terms notice) */
  below?: React.ReactNode;
}

/** Shared sign-in / sign-up page shell: meat-board background image,
 * logo + business name header and the white card. */
export function AuthShell({
  logoUrl,
  businessName,
  subtitle,
  children,
  footer,
  below,
}: AuthShellProps) {
  return (
    <div className="relative flex items-center justify-center min-h-[calc(100vh-200px)] overflow-hidden p-4">
      {/* Butcher-board backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-background"
      >
        <Image
          src="/images/auth-bg.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Soften the vivid photo so the card and text stay readable —
            heavier at the top (brand header) and edges, clearest mid-page */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/25 to-white/45 dark:from-black/60 dark:via-black/35 dark:to-black/55" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={businessName ?? "German Butcher"}
              width={64}
              height={64}
              priority
              className="w-16 h-16 shrink-0 rounded-2xl object-contain shadow-lg shadow-primaryColor/15 ring-1 ring-primaryColor/10 bg-white p-1"
            />
          ) : (
            <div className="flex shrink-0 items-center justify-center w-16 h-16 rounded-2xl bg-primaryColor text-white shadow-lg shadow-primaryColor/25 ring-1 ring-primaryColor/20">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
          )}
          <div className="text-left">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
              {businessName ?? "German Butcher"}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/60 bg-white/95 shadow-2xl shadow-gray-900/10 ring-1 ring-gray-900/5 overflow-hidden dark:border-gray-800 dark:bg-gray-900/95 dark:ring-white/10 dark:shadow-black/40">
          <div className="p-6 sm:p-8">{children}</div>
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 dark:bg-gray-800/50 dark:border-gray-800">
            {footer}
          </div>
        </div>

        {below ?? (
          <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-6">
            By continuing, you agree to our{" "}
            <Link
              href="/terms"
              className="hover:text-gray-600 dark:hover:text-gray-300"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="hover:text-gray-600 dark:hover:text-gray-300"
            >
              Privacy
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
