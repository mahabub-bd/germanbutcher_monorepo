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
import { OrderSummary } from "@/utils/types";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface CombinedOrdersSalesChartProps {
  chartData: OrderSummary[];
}

const ORDERS_COLOR = "hsl(215, 70%, 60%)"; // Blue for orders
const SALES_COLOR = "hsl(145, 70%, 50%)"; // Green for sales

export default function CombinedOrdersSalesChart({
  chartData,
}: CombinedOrdersSalesChartProps) {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowSize.width < 640;

  // Mobile shows only the last 6 months so bars stay readable on small screens
  const visibleData = isMobile ? chartData.slice(-6) : chartData;

  const totalOrders = chartData.reduce((sum, item) => sum + item.orderCount, 0);
  const totalSales = chartData.reduce((sum, item) => sum + item.totalValue, 0);

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
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="font-medium">{label}</div>
          {payload.map((entry: unknown, index: number) => {
            const e = entry as {
              color?: string;
              name?: string;
              value?: number;
            };
            return (
              <div
                key={`item-${index}`}
                className="flex items-center text-sm"
                style={{ color: e.color }}
              >
                <div
                  className="mr-2 h-2 w-2 rounded-full"
                  style={{ backgroundColor: e.color }}
                />
                <span className="mr-2">{e.name}:</span>
                <span className="font-medium">
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

  const chartHeightClass = "h-[280px] w-full sm:h-[320px] md:h-[350px] lg:h-[400px]";

  // Vertical (rotated) month labels on mobile so all 12 fit without crowding
  const xAxisProps = {
    dataKey: "month",
    axisLine: false,
    tickLine: false,
    tickMargin: isMobile ? 5 : 10,
    interval: 0 as const,
    angle: isMobile ? -90 : 0,
    textAnchor: (isMobile ? "end" : "middle") as "end" | "middle",
    height: isMobile ? 55 : 30,
    tick: { fontSize: isMobile ? 10 : 12 },
  };

  return (
    <Card className="w-full overflow-hidden">
      <Tabs defaultValue="combined" className="w-full min-w-0">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg sm:text-xl font-bold">Orders & Sales Overview</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {totalOrders.toLocaleString()} orders with{" "}
                {formatCurrencyEnglish(totalSales)} in sales
              </CardDescription>
            </div>
            <TabsList className="bg-gray-100 dark:bg-gray-800 w-full sm:w-auto overflow-x-auto">
              <TabsTrigger value="combined" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm flex-1 sm:flex-initial">
                Combined
              </TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm flex-1 sm:flex-initial">
                Orders
              </TabsTrigger>
              <TabsTrigger value="sales" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm flex-1 sm:flex-initial">
                Sales
              </TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>

        <CardContent className="min-w-0">

          <TabsContent value="combined" className="mt-0 min-w-0">
            <div className={chartHeightClass}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={visibleData}
                  margin={{ top: isMobile ? 10 : 20, right: isMobile ? 0 : 10, left: isMobile ? -10 : 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    opacity={0.3}
                  />
                  <XAxis {...xAxisProps} />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    width={isMobile ? 30 : 60}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={5}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    tickFormatter={(value) => value.toString()}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    width={isMobile ? 34 : 60}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={5}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={isMobile ? 28 : 36}
                    iconType="circle"
                    iconSize={isMobile ? 6 : 8}
                    wrapperStyle={{ fontSize: isMobile ? '11px' : '12px' }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="orderCount"
                    name="Orders"
                    fill={ORDERS_COLOR}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={isMobile ? 12 : 20}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="totalValue"
                    name="Sales"
                    fill={SALES_COLOR}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={isMobile ? 12 : 20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-0 min-w-0">
            <div className={chartHeightClass}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={visibleData}
                  margin={{ top: isMobile ? 10 : 20, right: 0, left: isMobile ? -10 : 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    opacity={0.3}
                  />
                  <XAxis {...xAxisProps} />
                  <YAxis
                    width={isMobile ? 30 : 60}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={5}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="orderCount"
                    name="Orders"
                    fill={ORDERS_COLOR}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={isMobile ? 16 : 30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="mt-0 min-w-0">
            <div className={chartHeightClass}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={visibleData}
                  margin={{ top: isMobile ? 10 : 20, right: 0, left: isMobile ? -10 : 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    opacity={0.3}
                  />
                  <XAxis {...xAxisProps} />
                  <YAxis
                    width={isMobile ? 34 : 60}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={5}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="totalValue"
                    name="Sales"
                    fill={SALES_COLOR}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={isMobile ? 16 : 30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
