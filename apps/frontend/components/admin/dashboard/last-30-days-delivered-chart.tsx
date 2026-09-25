"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrencyEnglish } from "@/lib/utils";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { Last30DaysData } from "@/utils/types";

export type { Last30DaysData };

interface Last30DaysDeliveredChartProps {
  chartData: Last30DaysData[];
}

// Blue-500 / Emerald-600 — validated pair (CVD-safe, >=3:1 on light & dark surfaces).
const ORDERS_COLOR = "#3b82f6";
const SALES_COLOR = "#059669";

const AXIS_TICK = { fontSize: 11, fill: "#9ca3af" };
const GRID_WRAPPER = "text-gray-200 dark:text-gray-800";

export default function Last30DaysDeliveredChart({
  chartData,
}: Last30DaysDeliveredChartProps) {
  // Format date for display (e.g., "Jan 4")
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Format data for chart with readable dates
  const formattedData = chartData.map((item) => ({
    ...item,
    formattedDate: formatDate(item.date),
  }));

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: unknown[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-white dark:bg-gray-800 p-2.5 shadow-lg">
          <div className="font-semibold mb-1.5 text-xs">{label}</div>
          {payload.map((entry: unknown, index: number) => {
            const e = entry as {
              color?: string;
              name?: string;
              value?: number;
            };
            return (
              <div
                key={`item-${index}`}
                className="flex items-center justify-between text-xs gap-4"
              >
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: e.color }}
                  />
                  <span className="text-gray-500 dark:text-gray-400">{e.name}</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {e.name === "Sales"
                    ? formatCurrencyEnglish(e.value ?? 0)
                    : (e.value ?? 0).toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const chartMargin = { top: 10, right: 6, left: 0, bottom: 0 };

  // Underline-style text tabs, like the reference design
  const tabListClassName =
    "bg-transparent dark:bg-transparent h-auto w-full max-w-md justify-start gap-4 rounded-none border-b border-gray-100 p-0 dark:border-gray-800";
  const tabTriggerClassName =
    "bg-transparent rounded-none border-0 border-b-2 border-transparent px-0 pb-2 text-sm font-normal text-gray-400 shadow-none transition-colors data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=active]:shadow-none data-[state=active]:border-gray-900 dark:text-gray-500 dark:data-[state=active]:bg-transparent dark:data-[state=active]:text-white dark:data-[state=active]:border-white";

  return (
    <Card className="w-full shadow-sm overflow-hidden">
      <Tabs defaultValue="overview" className="w-full">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl font-bold">Last 30 Days</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Daily order count and revenue trends
          </CardDescription>
          <TabsList className={tabListClassName}>
            <TabsTrigger value="overview" className={tabTriggerClassName}>
              Overview
            </TabsTrigger>
            <TabsTrigger value="orders" className={tabTriggerClassName}>
              Orders
            </TabsTrigger>
            <TabsTrigger value="sales" className={tabTriggerClassName}>
              Sales
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        <CardContent>
          <TabsContent value="overview" className="mt-0">
            {/* Dual axis: Orders (left) vs Sales (right). Each series reads
                against its own scale — compare shapes, not positions. */}
            <div className={GRID_WRAPPER}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={formattedData} margin={chartMargin}>
                  <defs>
                    <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ORDERS_COLOR} stopOpacity={0.22} />
                      <stop offset="90%" stopColor={ORDERS_COLOR} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={SALES_COLOR} stopOpacity={0.22} />
                      <stop offset="90%" stopColor={SALES_COLOR} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="currentColor" />
                  <XAxis
                    dataKey="formattedDate"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={4}
                    minTickGap={18}
                    tick={AXIS_TICK}
                    angle={-90}
                    textAnchor="end"
                    height={52}
                  />
                  <YAxis
                    yAxisId="orders"
                    orientation="left"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={4}
                    allowDecimals={false}
                    width={32}
                    tick={AXIS_TICK}
                  />
                  <YAxis
                    yAxisId="sales"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={4}
                    width={44}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    tick={AXIS_TICK}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#9ca3af", strokeDasharray: "4 4" }} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, paddingBottom: 8, color: "#6b7280" }}
                  />
                  <Area
                    yAxisId="orders"
                    type="monotone"
                    dataKey="orderCount"
                    name="Orders"
                    stroke={ORDERS_COLOR}
                    strokeWidth={2}
                    fill="url(#ordersFill)"
                    dot={{ r: 3, fill: ORDERS_COLOR, strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff", fill: ORDERS_COLOR }}
                  />
                  <Area
                    yAxisId="sales"
                    type="monotone"
                    dataKey="totalValue"
                    name="Sales"
                    stroke={SALES_COLOR}
                    strokeWidth={2}
                    fill="url(#salesFill)"
                    dot={{ r: 3, fill: SALES_COLOR, strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff", fill: SALES_COLOR }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-0">
            <div className={GRID_WRAPPER}>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={formattedData} margin={chartMargin}>
                  <defs>
                    <linearGradient id="ordersSoloFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ORDERS_COLOR} stopOpacity={0.22} />
                      <stop offset="90%" stopColor={ORDERS_COLOR} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="currentColor" />
                  <XAxis
                    dataKey="formattedDate"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={4}
                    minTickGap={18}
                    tick={AXIS_TICK}
                    angle={-90}
                    textAnchor="end"
                    height={52}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickMargin={4}
                    allowDecimals={false}
                    width={32}
                    tick={AXIS_TICK}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#9ca3af", strokeDasharray: "4 4" }} />
                  <Area
                    type="monotone"
                    dataKey="orderCount"
                    name="Orders"
                    stroke={ORDERS_COLOR}
                    strokeWidth={2}
                    fill="url(#ordersSoloFill)"
                    dot={{ r: 3, fill: ORDERS_COLOR, strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff", fill: ORDERS_COLOR }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="mt-0">
            <div className={GRID_WRAPPER}>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={formattedData} margin={chartMargin}>
                  <defs>
                    <linearGradient id="salesSoloFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={SALES_COLOR} stopOpacity={0.22} />
                      <stop offset="90%" stopColor={SALES_COLOR} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="currentColor" />
                  <XAxis
                    dataKey="formattedDate"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={4}
                    minTickGap={18}
                    tick={AXIS_TICK}
                    angle={-90}
                    textAnchor="end"
                    height={52}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickMargin={4}
                    width={44}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    tick={AXIS_TICK}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#9ca3af", strokeDasharray: "4 4" }} />
                  <Area
                    type="monotone"
                    dataKey="totalValue"
                    name="Sales"
                    stroke={SALES_COLOR}
                    strokeWidth={2}
                    fill="url(#salesSoloFill)"
                    dot={{ r: 3, fill: SALES_COLOR, strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff", fill: SALES_COLOR }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
