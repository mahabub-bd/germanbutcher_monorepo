import type { OrderSummary } from "@/utils/types";
import { useMemo } from "react";

const MONTH_INDEX: Record<string, number> = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
};

const EMPTY_MONTH: OrderSummary = {
  year: 0,
  month: "",
  totalValue: 0,
  orderCount: 0,
  cancelOrderCount: 0,
  cancelValue: 0,
};

const growth = (curr: number, prev: number) =>
  prev === 0 ? 0 : ((curr - prev) / prev) * 100;

export function useDashboardMetrics(chartData: OrderSummary[]) {
  return useMemo(() => {
    const sorted = [...chartData].sort(
      (a, b) =>
        new Date(a.year, MONTH_INDEX[a.month]).getTime() -
        new Date(b.year, MONTH_INDEX[b.month]).getTime()
    );

    const current = sorted.at(-1) ?? EMPTY_MONTH;
    const previous = sorted.at(-2) ?? EMPTY_MONTH;

    const totals = chartData.reduce(
      (acc, cur) => {
        acc.sales += cur.totalValue;
        acc.orders += cur.orderCount;
        acc.cancelOrders += cur.cancelOrderCount ?? 0;
        acc.cancelValue += cur.cancelValue ?? 0;
        return acc;
      },
      { sales: 0, orders: 0, cancelOrders: 0, cancelValue: 0 }
    );

    return {
      current,
      previous,
      totals,
      salesGrowth: growth(current.totalValue, previous.totalValue),
      cancelGrowth: growth(
        current.cancelValue ?? 0,
        previous.cancelValue ?? 0
      ),
    };
  }, [chartData]);
}
