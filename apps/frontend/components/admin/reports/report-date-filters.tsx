"use client";

import { DateRangePreset } from "@/common/enums";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Filter,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { useEffect, useState, type ReactNode } from "react";

export interface ReportFilterParams {
  preset?: string;
  fromDate?: string;
  toDate?: string;
}

const WEEK_STARTS_ON = 6; // Saturday

const PRESET_ITEMS: { value: DateRangePreset; label: string }[] = [
  { value: DateRangePreset.TODAY, label: "Today" },
  { value: DateRangePreset.THIS_WEEK, label: "This Week" },
  { value: DateRangePreset.LAST_WEEK, label: "Last Week" },
  { value: DateRangePreset.THIS_MONTH, label: "This Month" },
  { value: DateRangePreset.LAST_MONTH, label: "Last Month" },
  { value: DateRangePreset.LAST_3_MONTHS, label: "Last 3 Months" },
  { value: DateRangePreset.LAST_6_MONTHS, label: "Last 6 Months" },
  { value: DateRangePreset.LAST_YEAR, label: "Last Year" },
  { value: DateRangePreset.THIS_YEAR, label: "This Year" },
];

/** Resolves a quick-range preset to its [from, to] date pair. */
export function rangeForPreset(
  value: string
): [Date | undefined, Date | undefined] {
  const today = new Date();
  switch (value) {
    case DateRangePreset.TODAY:
      return [today, today];
    case DateRangePreset.THIS_WEEK:
      return [
        startOfWeek(today, { weekStartsOn: WEEK_STARTS_ON }),
        endOfWeek(today, { weekStartsOn: WEEK_STARTS_ON }),
      ];
    case DateRangePreset.LAST_WEEK:
      return [
        subWeeks(startOfWeek(today, { weekStartsOn: WEEK_STARTS_ON }), 1),
        subWeeks(endOfWeek(today, { weekStartsOn: WEEK_STARTS_ON }), 1),
      ];
    case DateRangePreset.THIS_MONTH:
      return [startOfMonth(today), endOfMonth(today)];
    case DateRangePreset.LAST_MONTH: {
      const lastMonth = subMonths(today, 1);
      return [startOfMonth(lastMonth), endOfMonth(lastMonth)];
    }
    case DateRangePreset.LAST_3_MONTHS:
      return [subMonths(today, 3), today];
    case DateRangePreset.LAST_6_MONTHS:
      return [subMonths(today, 6), today];
    case DateRangePreset.LAST_YEAR:
      return [subYears(today, 1), today];
    case DateRangePreset.THIS_YEAR:
      return [new Date(today.getFullYear(), 0, 1), today];
    default:
      return [undefined, undefined];
  }
}

interface ReportDateFiltersProps {
  preset?: string;
  fromDate?: string;
  toDate?: string;
  /** Extra filter controls (e.g. an Order Status select) rendered inline
   *  between Quick Range and the date pickers. */
  extra?: ReactNode;
  onApply: (params: ReportFilterParams) => void;
  /** Called alongside onApply({}) when Clear is pressed, so pages with
   *  extra filters can reset their own state too. */
  onClear?: () => void;
  /** Extra classes for the wrapper card — pages can pass bare styling
   *  ("mb-0 border-none bg-transparent p-0 shadow-none") to embed the
   *  controls inline in a page header instead of a standalone panel. */
  className?: string;
}

export function ReportDateFilters({
  preset,
  fromDate,
  toDate,
  extra,
  onApply,
  onClear,
  className,
}: ReportDateFiltersProps) {
  const [mounted, setMounted] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(
    fromDate ? new Date(fromDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    toDate ? new Date(toDate) : undefined
  );
  const [quickRange, setQuickRange] = useState<string>(preset || "");
  // Bumped on Clear so the DatePickers remount and lose their stale
  // internally-held date (DatePicker keeps its own copy once picked).
  const [resetKey, setResetKey] = useState(0);
  // Panel is collapsed by default on mobile; md+ always shows the row.
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleQuickRange = (value: string) => {
    if (value === "__none__") {
      // "Clear selection" — behaves like pressing Clear.
      handleClear();
      return;
    }
    setQuickRange(value);
    const [from, to] = rangeForPreset(value);
    setStartDate(from);
    setEndDate(to);
    onApply({ preset: value });
    // Preset applied — fold the panel away again on mobile.
    setMobileOpen(false);
  };

  const handleStartDate = (date: Date | undefined) => {
    setStartDate(date);
    if (!date) return;
    // Manual edit: the quick-range preset no longer matches the shown dates.
    setQuickRange("");
    // Keep the range valid — pull "To" up if "From" moved past it.
    if (endDate && date > endDate) setEndDate(date);
  };

  const handleEndDate = (date: Date | undefined) => {
    setEndDate(date);
    if (!date) return;
    setQuickRange("");
    // Keep the range valid — pull "From" back if "To" moved before it.
    if (startDate && date < startDate) setStartDate(date);
  };

  const handleApply = () => {
    const params: ReportFilterParams = {};
    if (startDate) params.fromDate = format(startDate, "yyyy-MM-dd");
    if (endDate) params.toDate = format(endDate, "yyyy-MM-dd");
    onApply(params);
    // Applied — fold the panel away again on mobile.
    setMobileOpen(false);
  };

  /** Short human-readable summary of the current selection for the
   *  collapsed mobile header. */
  const activeSummary = ((): string => {
    if (quickRange)
      return PRESET_ITEMS.find((p) => p.value === quickRange)?.label ?? "";
    if (startDate && endDate)
      return `${format(startDate, "d MMM yyyy")} – ${format(endDate, "d MMM yyyy")}`;
    if (startDate) return `From ${format(startDate, "d MMM yyyy")}`;
    if (endDate) return `To ${format(endDate, "d MMM yyyy")}`;
    return "All time";
  })();

  const handleClear = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setQuickRange("");
    setResetKey((k) => k + 1);
    onClear?.();
    onApply({});
  };

  if (!mounted) return null;

  const hasSelection = Boolean(startDate || endDate || quickRange);

  // Card-style filter panel.
  //  - Mobile (< md): a collapsible "Filters" section — collapsed by default
  //    showing a summary of the active range; expanded it stacks every control
  //    full width so placeholders are never truncated.
  //  - md+: always-open single nowrap row of equally styled controls.
  return (
    <div className={cn("mb-6 rounded-xl border bg-card p-3 shadow-xs", className)}>
      {/* Mobile toggle header (hidden on md+) */}
      <button
        type="button"
        onClick={() => setMobileOpen((o) => !o)}
        aria-expanded={mobileOpen}
        className="flex w-full items-center justify-between gap-2 md:hidden"
      >
        <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
          <SlidersHorizontal className="size-4 shrink-0 text-muted-foreground" />
          Filters
          <span className="truncate rounded-md bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
            {activeSummary}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            mobileOpen && "rotate-180"
          )}
        />
      </button>

      {/* Controls — collapsible on mobile, always visible on md+ */}
      <div
        className={cn(
          "grid grid-cols-1 items-center gap-2.5 md:flex md:flex-nowrap md:items-center md:gap-3",
          !mobileOpen && "hidden md:flex"
        )}
      >
        <div className="md:shrink-0">
          <Select value={quickRange} onValueChange={handleQuickRange}>
            <SelectTrigger className="w-full md:w-44">
              <SelectValue placeholder="Quick Range" />
            </SelectTrigger>
            <SelectContent>
              {PRESET_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
              {quickRange && (
                <SelectItem value="__none__" className="text-muted-foreground">
                  Clear selection
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {extra}

        <div className="md:flex-1 md:max-w-48 md:min-w-0">
          <DatePicker
            key={`from-${resetKey}`}
            value={startDate}
            onChange={handleStartDate}
            placeholder="From Date"
            maxDate={endDate}
            showIcon={false}
          />
        </div>
        <div className="md:flex-1 md:max-w-48 md:min-w-0">
          <DatePicker
            key={`to-${resetKey}`}
            value={endDate}
            onChange={handleEndDate}
            placeholder="To Date"
            minDate={startDate}
            showIcon={false}
          />
        </div>

        {/* Actions: share a row on mobile (split in half), join the md+ row
            via display:contents. */}
        <div className="grid grid-cols-2 gap-2.5 md:contents">
          <Button
            onClick={handleApply}
            className="h-9 shrink-0 gap-1.5 px-4 font-medium"
          >
            <Filter className="size-4" />
            Filter
          </Button>
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={!hasSelection && !onClear}
            className={cn(
              "h-9 shrink-0 gap-1.5 px-4",
              !hasSelection && "text-muted-foreground"
            )}
          >
            <X className="size-4" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
