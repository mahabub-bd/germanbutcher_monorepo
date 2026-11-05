"use client";

import { PaginationComponent } from "@/components/common/pagination";
import { cn } from "@/lib/utils";

interface ListPaginationFooterProps {
  /** 1-based current page. */
  currentPage: number;
  /** Rows requested per page — used to derive the shown range. */
  limit: number;
  /** Total rows across all pages (after filters). */
  totalItems: number;
  /** Total pages; the page strip only renders when this is > 1. */
  totalPages: number;
  /** Singular entity noun, e.g. "user". */
  entityLabel: string;
  /** Optional irregular plural; defaults to `${entityLabel}s`. */
  entityLabelPlural?: string;
  /**
   * Client-side page handler. Optional so the footer can also be rendered from
   * a Server Component, where only serializable props may cross the boundary —
   * in that case supply `paginationUrls`/`baseUrl` for plain link navigation.
   */
  onPageChange?: (page: number) => void;
  baseUrl?: string;
  /** Pre-built `?…&page=N` URLs keyed by page; used for server-driven links. */
  paginationUrls?: Record<number, string>;
  /** When set, appends `matching “…”` on desktop. */
  searchQuery?: string;
  /** When set, renders a truncated `· summary` line after the count. */
  filterSummary?: string;
  /**
   * `inset`     — a footer divider (`border-t`) that lives inside a list card.
   * `standalone` — its own rounded bordered card, detached from the table.
   * `plain`      — a bare flex row (no border/card) for card-less storefronts.
   */
  variant?: "inset" | "standalone" | "plain";
  className?: string;
}

const fmt = (n: number) => n.toLocaleString("en-US");

/**
 * Shared list footer: a result-count summary ("Showing 1–12 of 2,573 users")
 * paired with the pagination strip. Collapses to a compact "1–12 of 2,573"
 * line on mobile so the range never stacks above the page buttons.
 */
export function ListPaginationFooter({
  currentPage,
  limit,
  totalItems,
  totalPages,
  entityLabel,
  entityLabelPlural,
  onPageChange,
  baseUrl = "#",
  paginationUrls,
  searchQuery,
  filterSummary,
  variant = "inset",
  className,
}: ListPaginationFooterProps) {
  const firstRow = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const lastRow = Math.min(currentPage * limit, totalItems);

  const plural = entityLabelPlural ?? `${entityLabel}s`;
  const noun = totalItems === 1 ? entityLabel : plural;

  const container =
    variant === "standalone"
      ? "mt-6 mb-6 flex flex-col items-center gap-x-3 gap-y-1 rounded-xl border bg-card px-3 py-2 shadow-xs md:flex-row md:justify-between"
      : variant === "plain"
        ? "mt-6 flex flex-col items-center justify-between gap-4 md:flex-row"
        : "flex flex-col items-center justify-between gap-3 border-t px-4 py-3 md:flex-row";

  return (
    <div className={cn(container, className)}>
      <div className="flex min-w-0 grow items-center gap-2 text-sm text-muted-foreground">
        <span className="whitespace-nowrap tabular-nums">
          {totalItems === 0 ? (
            <>No {plural} found</>
          ) : (
            <>
              {/* Mobile: compact range so it stays on one line. */}
              <span className="md:hidden">
                {fmt(firstRow)}–{fmt(lastRow)} of {fmt(totalItems)} {noun}
              </span>
              {/* Desktop: full sentence. */}
              <span className="hidden md:inline">
                Showing {fmt(firstRow)} to {fmt(lastRow)} of {fmt(totalItems)}{" "}
                {noun}
                {searchQuery ? ` matching “${searchQuery}”` : ""}
              </span>
            </>
          )}
        </span>

        {filterSummary && totalItems > 0 && (
          <span
            className="min-w-0 max-w-[45vw] truncate opacity-80 md:max-w-none"
            title={filterSummary}
          >
            · {filterSummary}
          </span>
        )}
      </div>

      {totalPages > 1 && totalItems > 0 && (
        <PaginationComponent
          currentPage={currentPage}
          totalPages={totalPages}
          baseUrl={baseUrl}
          paginationUrls={paginationUrls}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

export default ListPaginationFooter;
