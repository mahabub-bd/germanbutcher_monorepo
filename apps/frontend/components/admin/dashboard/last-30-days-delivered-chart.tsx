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
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface Last30DaysData {
  date: string;
  orderCount: number;
  totalValue: number;
}

interface Last30DaysDeliveredChartProps {
  chartData: Last30DaysData[];
}

const ORDERS_COLOR = "#3b82f6"; // Blue-500
const ORDERS_COLOR_LIGHT = "#60a5fa"; // Blue-400
const SALES_COLOR = "#10b981"; // Emerald-500
const SALES_COLOR_LIGHT = "#34d399"; // Emerald-400

export default function Last30DaysDeliveredChart({
  chartData,
}: Last30DaysDeliveredChartProps) {
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

  // Calculate interval based on screen width
  const getXAxisInterval = () => {
    const { width } = windowSize;
    if (width < 640) return 4; // Show every 5th label on mobile
    if (width < 768) return 3; // Show every 4th label on small tablets
    if (width < 1024) return 2; // Show every 3rd label on tablets
    return 0; // Show all labels on desktop
  };

  const xAxisInterval = getXAxisInterval();

  const totalOrders = chartData.reduce((sum, item) => sum + item.orderCount, 0);
  const totalSales = chartData.reduce((sum, item) => sum + item.totalValue, 0);
  const avgOrders = totalOrders / (chartData.length || 1);
  const avgSales = totalSales / (chartData.length || 1);

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
        <div className="rounded-lg border bg-white dark:bg-gray-800 p-3 shadow-lg">
          <div className="font-semibold mb-2 text-sm">{label}</div>
          {payload.map((entry: unknown, index: number) => {
            const e = entry as {
              color?: string;
              name?: string;
              value?: number;
            };
            return (
              <div
                key={`item-${index}`}
                className="flex items-center justify-between text-sm gap-4"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: e.color }}
                  />
                  <span className="text-gray-600 dark:text-gray-400">{e.name}:</span>
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

  // Custom tick component to rotate labels vertically
  const CustomAxisTick = ({
    x,
    y,
    payload,
  }: {
    x?: number;
    y?: number;
    payload?: { value: string };
  }) => {
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={5}
          transform="rotate(-90)"
          fontSize={13}
          fontWeight={600}
          fill="currentColor"
          className="text-gray-700 dark:text-gray-300"
          textAnchor="end"
        >
          {payload?.value}
        </text>
      </g>
    );
  };

  return (
    <Card className="w-full border-2 shadow-lg overflow-hidden">
      <Tabs defaultValue="trend" className="w-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg sm:text-xl font-bold">Last 30 Days</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Daily order count and revenue trends
              </CardDescription>
            </div>
            <TabsList className="bg-gray-100 dark:bg-gray-800 w-full sm:w-auto overflow-x-auto">
              <TabsTrigger value="trend" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm flex-1 sm:flex-initial">
                Trend
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

        <CardContent>

          <TabsContent value="trend" className="mt-0">
            <ResponsiveContainer
              width="100%"
              height={280}
              className="sm:h-[320px] md:h-[350px] lg:h-[400px]"
            >
              <LineChart
                data={formattedData}
                margin={{ top: windowSize.width < 640 ? 10 : 20, right: windowSize.width < 640 ? 5 : 10, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="trendOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ORDERS_COLOR} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={ORDERS_COLOR} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="trendSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SALES_COLOR} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={SALES_COLOR} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis
                  dataKey="formattedDate"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  interval={xAxisInterval}
                  tick={<CustomAxisTick />}
                  height={80}
                />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 12, fill: "currentColor" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12, fill: "currentColor" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={windowSize.width < 640 ? 28 : 36} iconType="circle" iconSize={windowSize.width < 640 ? 8 : 10} wrapperStyle={{ fontSize: windowSize.width < 640 ? '11px' : '12px' }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="orderCount"
                  name="Orders"
                  stroke={ORDERS_COLOR}
                  strokeWidth={3}
                  fill="url(#trendOrders)"
                  dot={{ fill: ORDERS_COLOR, r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: ORDERS_COLOR }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="totalValue"
                  name="Sales"
                  stroke={SALES_COLOR}
                  strokeWidth={3}
                  fill="url(#trendSales)"
                  dot={{ fill: SALES_COLOR, r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: SALES_COLOR }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="orders" className="mt-0">
            <ResponsiveContainer
              width="100%"
              height={280}
              className="sm:h-[320px] md:h-[350px] lg:h-[400px]"
            >
              <BarChart
                data={formattedData}
                margin={{ top: windowSize.width < 640 ? 10 : 20, right: windowSize.width < 640 ? 5 : 10, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="barOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ORDERS_COLOR_LIGHT}/>
                    <stop offset="100%" stopColor={ORDERS_COLOR}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis
                  dataKey="formattedDate"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  interval={xAxisInterval}
                  tick={<CustomAxisTick />}
                  height={80}
                />
                <YAxis axisLine={false} tickLine={false} tickMargin={10} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="orderCount"
                  name="Orders"
                  fill="url(#barOrders)"
                  radius={[6, 6, 0, 0]}
                  barSize={windowSize.width < 640 ? 8 : 12}
                />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="sales" className="mt-0">
            <ResponsiveContainer
              width="100%"
              height={280}
              className="sm:h-[320px] md:h-[350px] lg:h-[400px]"
            >
              <BarChart
                data={formattedData}
                margin={{ top: windowSize.width < 640 ? 10 : 20, right: windowSize.width < 640 ? 5 : 10, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="barSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={SALES_COLOR_LIGHT}/>
                    <stop offset="100%" stopColor={SALES_COLOR}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis
                  dataKey="formattedDate"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  interval={xAxisInterval}
                  tick={<CustomAxisTick />}
                  height={80}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="totalValue"
                  name="Sales"
                  fill="url(#barSales)"
                  radius={[6, 6, 0, 0]}
                  barSize={windowSize.width < 640 ? 8 : 12}
                />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
