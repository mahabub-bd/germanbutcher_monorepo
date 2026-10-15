"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { DeviceBreakdownData, NamedCount } from "@/utils/types";

interface DeviceChartProps {
  data: DeviceBreakdownData;
}

const DEVICE_COLORS = ["#10b981", "#f59e0b", "#6366f1"];
const BROWSER_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#a855f7"];

function sumCounts(rows: NamedCount[]): number {
  return rows.reduce((sum, row) => sum + row.count, 0);
}

export function DeviceChart({ data }: DeviceChartProps) {
  const devices = data.devices.filter((d) => d.count > 0);
  const browsers = data.browsers.filter((b) => b.count > 0);
  const deviceTotal = sumCounts(devices);

  if (deviceTotal === 0) {
    return (
      <Card className="h-full rounded-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Devices</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="h-full rounded-sm">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Devices</CardTitle>
        <CardDescription>Mobile vs desktop, plus browser split</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <div className="relative">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={devices}
                    dataKey="count"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {devices.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={DEVICE_COLORS[index % DEVICE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold">
                  {deviceTotal.toLocaleString()}
                </span>
                <span className="text-[11px] text-muted-foreground">Total</span>
              </div>
            </div>
            <div className="mt-2 space-y-1.5">
              {devices.map((device, index) => (
                <div
                  key={device.name}
                  className="flex items-center gap-2 text-xs"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        DEVICE_COLORS[index % DEVICE_COLORS.length],
                    }}
                  />
                  <span className="flex-1">{device.name}</span>
                  <span className="font-medium">
                    {device.count.toLocaleString()}
                  </span>
                  <span className="w-10 text-right text-muted-foreground">
                    {Math.round((device.count / deviceTotal) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Browsers
            </p>
            {browsers.map((browser, index) => {
              const browserTotal = sumCounts(browsers);
              const pct =
                browserTotal > 0
                  ? Math.round((browser.count / browserTotal) * 100)
                  : 0;
              return (
                <div key={browser.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span>{browser.name}</span>
                    <span className="font-medium">
                      {browser.count.toLocaleString()} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor:
                          BROWSER_COLORS[index % BROWSER_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {browsers.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No browser data yet
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
