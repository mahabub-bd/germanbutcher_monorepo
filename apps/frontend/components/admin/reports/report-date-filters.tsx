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
}

export function ReportDateFilters({
  preset,
  fromDate,
  toDate,
  extra,
  onApply,
  onClear,
}: ReportDateFiltersProps) {
  const [mounted, setMounted] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(
    fromDate ? new Date(fromDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    toDate ? new Date(toDate) : undefined
  );
  const [quickRange, setQuickRange] = useState<string>(preset || "");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleQuickRange = (value: string) => {
    setQuickRange(value);
    const [from, to] = rangeForPreset(value);
    setStartDate(from);
    setEndDate(to);
    onApply({ preset: value });
  };

  const handleApply = () => {
    const params: ReportFilterParams = {};
    if (startDate) params.fromDate = format(startDate, "yyyy-MM-dd");
    if (endDate) params.toDate = format(endDate, "yyyy-MM-dd");
    onApply(params);
  };

  const handleClear = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setQuickRange("");
    onClear?.();
    onApply({});
  };

  if (!mounted) return null;

  // Mobile: 2-column grid so every control (Quick Range included) is half
  // width. md+ (1 line): nowrap inline row — no labels, every control (selects,
  // date pickers, buttons) sits on the same line via placeholders.
  return (
    <div className="grid grid-cols-2 gap-2 items-center mb-6 md:flex md:flex-nowrap md:items-center md:gap-2">
      <div className="md:shrink-0">
        <Select value={quickRange} onValueChange={handleQuickRange}>
          <SelectTrigger className="w-full md:w-37.5">
            <SelectValue placeholder="Quick Range" />
          </SelectTrigger>
          <SelectContent>
            {PRESET_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {extra}

      <div className="md:flex-1 md:max-w-37.5 md:min-w-0">
        <DatePicker
          value={startDate}
          onChange={(date) => setStartDate(date)}
          placeholder="From Date"
        />
      </div>
      <div className="md:flex-1 md:max-w-37.5 md:min-w-0">
        <DatePicker
          value={endDate}
          onChange={(date) => setEndDate(date)}
          placeholder="To Date"
        />
      </div>

      <Button onClick={handleApply} className="px-3 shrink-0">
        Filter
      </Button>
      <Button variant="outline" onClick={handleClear} className="px-3 shrink-0">
        Clear
      </Button>
    </div>
  );
}
