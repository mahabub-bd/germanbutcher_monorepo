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

interface ReportDateFiltersProps {
  preset?: string;
  fromDate?: string;
  toDate?: string;
  onApply: (params: {
    preset?: string;
    fromDate?: string;
    toDate?: string;
  }) => void;
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

  const rangeFor = (value: string): [Date | undefined, Date | undefined] => {
    const today = new Date();
    switch (value) {
      case DateRangePreset.TODAY:
        return [today, today];
      case DateRangePreset.THIS_WEEK:
        return [
          startOfWeek(today, { weekStartsOn: 6 }),
          endOfWeek(today, { weekStartsOn: 6 }),
        ];
      case DateRangePreset.LAST_WEEK:
        return [
          subWeeks(startOfWeek(today, { weekStartsOn: 6 }), 1),
          subWeeks(endOfWeek(today, { weekStartsOn: 6 }), 1),
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
  };

  const handleQuickRange = (value: string) => {
    setQuickRange(value);
    const [from, to] = rangeFor(value);
    setStartDate(from);
    setEndDate(to);
    onApply({ preset: value });
  };

  const handleApply = () => {
    const params: {
      preset?: string;
      fromDate?: string;
      toDate?: string;
    } = {};
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
    <div className="flex flex-wrap items-end gap-3 mb-6">
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Quick Range</label>
        <Select value={quickRange} onValueChange={handleQuickRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Quick Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DateRangePreset.TODAY}>Today</SelectItem>
            <SelectItem value={DateRangePreset.THIS_WEEK}>This Week</SelectItem>
            <SelectItem value={DateRangePreset.LAST_WEEK}>Last Week</SelectItem>
            <SelectItem value={DateRangePreset.THIS_MONTH}>
              This Month
            </SelectItem>
            <SelectItem value={DateRangePreset.LAST_MONTH}>
              Last Month
            </SelectItem>
            <SelectItem value={DateRangePreset.LAST_3_MONTHS}>
              Last 3 Months
            </SelectItem>
            <SelectItem value={DateRangePreset.LAST_6_MONTHS}>
              Last 6 Months
            </SelectItem>
            <SelectItem value={DateRangePreset.LAST_YEAR}>Last Year</SelectItem>
            <SelectItem value={DateRangePreset.THIS_YEAR}>This Year</SelectItem>
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
