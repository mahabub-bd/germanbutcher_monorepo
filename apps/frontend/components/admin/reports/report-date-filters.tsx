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
import { useEffect, useState } from "react";

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
  onApply: (params: ReportFilterParams) => void;
}

export function ReportDateFilters({
  preset,
  fromDate,
  toDate,
  onApply,
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
    onApply({});
  };

  if (!mounted) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 items-end gap-3 mb-6">
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Quick Range</label>
        <Select value={quickRange} onValueChange={handleQuickRange}>
          <SelectTrigger className="w-full">
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

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">From</label>
        <DatePicker value={startDate} onChange={(date) => setStartDate(date)} />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">To</label>
        <DatePicker value={endDate} onChange={(date) => setEndDate(date)} />
      </div>

      <Button onClick={handleApply}>Apply</Button>
      <Button variant="outline" onClick={handleClear}>
        Clear
      </Button>
    </div>
  );
}
