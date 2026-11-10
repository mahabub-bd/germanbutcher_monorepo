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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
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
import {
  ChevronDown,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

export interface ReportFilterParams {
  preset?: string;
  fromDate?: string;
  toDate?: string;
  /** True when this onApply comes from the Clear button (as opposed to
   * Filter with no date selection) so pages can tell the two apart. */
  clear?: boolean;
}

// Bangladesh business week runs Sunday→Saturday (weekend is Fri/Sat), which
// is also how the backend resolves the this_week / last_week presets.
const WEEK_STARTS_ON = 0; // Sunday

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
  /** Visible label for `extra` inside the mobile filter sheet. */
  extraLabel?: string;
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
  extraLabel,
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

  /** Applies the given range immediately — every change (preset, manual
   *  pick, clear) filters without waiting for a button press. */
  const applyRange = (from: Date | undefined, to: Date | undefined) => {
    const params: ReportFilterParams = {};
    if (from) params.fromDate = format(from, "yyyy-MM-dd");
    if (to) params.toDate = format(to, "yyyy-MM-dd");
    onApply(params);
    // Applied — fold the panel away again on mobile.
    setMobileOpen(false);
  };

  const handleStartDate = (date: Date | undefined) => {
    // Keep the range valid — pull "To" up if "From" moved past it.
    const nextEnd = date && endDate && date > endDate ? date : endDate;
    setStartDate(date);
    setEndDate(nextEnd);
    // Manual edit: the quick-range preset no longer matches the shown dates.
    setQuickRange("");
    applyRange(date, nextEnd);
  };

  const handleEndDate = (date: Date | undefined) => {
    // Keep the range valid — pull "From" back if "To" moved before it.
    const nextStart = date && startDate && date < startDate ? date : startDate;
    setStartDate(nextStart);
    setEndDate(date);
    setQuickRange("");
    applyRange(nextStart, date);
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
    onApply({ clear: true });
  };

  if (!mounted) return null;

  const hasSelection = Boolean(startDate || endDate || quickRange);

  // The shared filter controls — the same nodes are rendered inline on
  // desktop ("bar" row) and full width under visible labels inside the
  // mobile bottom sheet, so both layouts stay in sync.
  const quickRangeSelect = (
    <Select value={quickRange} onValueChange={handleQuickRange}>
      <SelectTrigger className="w-full text-xs md:w-36 2xl:w-44 2xl:text-sm">
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
  );

  const fromPicker = (
    <DatePicker
      key={`from-${resetKey}`}
      value={startDate}
      onChange={handleStartDate}
      placeholder="From Date"
      maxDate={endDate}
      showIcon={false}
      className="text-xs 2xl:text-sm"
    />
  );

  const toPicker = (
    <DatePicker
      key={`to-${resetKey}`}
      value={endDate}
      onChange={handleEndDate}
      placeholder="To Date"
      minDate={startDate}
      showIcon={false}
      className="text-xs 2xl:text-sm"
    />
  );

  const controls = (
    <>
      <div className="md:shrink-0">{quickRangeSelect}</div>
      {extra}
      <div className="md:w-40 md:shrink-0 2xl:w-48">{fromPicker}</div>
      <div className="md:w-40 md:shrink-0 2xl:w-48">{toPicker}</div>
    </>
  );

  // Desktop actions: no Filter button — every control applies immediately,
  // so Clear is the only action. md:contents dissolves it into the row.
  const actions = (
    <div className="md:contents">
      <Button
        variant="outline"
        onClick={handleClear}
        disabled={!hasSelection && !onClear}
        className={cn(
          "h-9 shrink-0 gap-1.5 px-3 text-xs 2xl:px-4 2xl:text-sm",
          !hasSelection && "text-muted-foreground"
        )}
      >
        <X className="size-4" />
        Clear
      </Button>
    </div>
  );

  const sheetLabel = "mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground";

  // Card-style filter panel.
  //  - Mobile (< md): a "Filters" button showing the active range summary —
  //    tapping opens a bottom sheet with every control stacked full width
  //    under a label and a sticky Clear footer. Every change applies and
  //    closes the sheet immediately.
  //  - md+: always-open single nowrap row of equally styled controls.
  return (
    <div className={cn("mb-6 rounded-xl border bg-card p-3 shadow-xs", className)}>
      {/* Mobile trigger (hidden on md+) */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-haspopup="dialog"
        className="flex w-full items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2.5 text-sm font-medium md:hidden"
      >
        <span className="flex min-w-0 items-center gap-2">
          <SlidersHorizontal className="size-4 shrink-0 text-muted-foreground" />
          Filters
          <span className="truncate rounded-md bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
            {activeSummary}
          </span>
        </span>
        <ChevronDown className="size-4 shrink-0 -rotate-90 text-muted-foreground" />
      </button>

      {/* Desktop inline row (hidden below md). 12px text + narrower fixed
          widths below 2xl keep the row compact on laptops; the row stays on
          one line and scrolls horizontally there instead of overflowing,
          exactly like the report tables. 2xl restores the original 14px
          single-line layout that fits without scrolling. */}
      <div className="hidden items-center gap-2 text-xs md:flex md:flex-nowrap md:overflow-x-auto 2xl:gap-3 2xl:overflow-x-visible 2xl:text-sm">
        {controls}
        {actions}
      </div>

      {/* Mobile filter bottom sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="bottom"
          className="inset-x-3 max-h-[82dvh] gap-0 overflow-y-auto rounded-2xl"
        >
          <SheetHeader className="border-b pr-14">
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>
              Narrow this report by date range.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-4 pt-4">
            <div>
              <p className={sheetLabel}>Quick Range</p>
              {quickRangeSelect}
            </div>
            {extra && (
              <div>
                {extraLabel && <p className={sheetLabel}>{extraLabel}</p>}
                {/* `extra` may carry several stacked controls (e.g. an
                    order + a payment status select) — space them out. */}
                <div className="[&>*+*]:mt-4">{extra}</div>
              </div>
            )}
            <div>
              <p className={sheetLabel}>From Date</p>
              {fromPicker}
            </div>
            <div>
              <p className={sheetLabel}>To Date</p>
              {toPicker}
            </div>
          </div>

          <SheetFooter className="sticky bottom-0 mt-4 flex-row border-t bg-background pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button
              variant="outline"
              className="flex-1 gap-1.5"
              disabled={!hasSelection && !onClear}
              onClick={() => {
                handleClear();
                setMobileOpen(false);
              }}
            >
              <X className="size-4" />
              Clear
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
