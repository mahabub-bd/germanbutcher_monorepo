"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Circle,
  Compass,
  Flame,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { DeviceBreakdownData, NamedCount } from "@/utils/types";

interface DeviceChartProps {
  data: DeviceBreakdownData;
}

const DEVICE_COLORS = ["#10b981", "#f59e0b", "#6366f1"];
const BROWSER_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#a855f7"];

/** Icon per device label as reported by the analytics service
 * (Mobile / Tablet / Desktop). Unknown labels fall back to the monitor icon. */
function deviceIcon(name: string): LucideIcon {
  switch (name.toLowerCase()) {
    case "mobile":
      return Smartphone;
    case "tablet":
      return Tablet;
    default:
      return Monitor;
  }
}

/** Distinct glyph per browser as reported by the analytics service
 * (Chrome / Safari / Firefox / Edge / Opera) — lucide dropped brand logos,
 * so each browser gets its closest visual stand-in. */
function browserIcon(name: string): LucideIcon {
  switch (name.toLowerCase()) {
    case "safari":
      return Compass;
    case "firefox":
      return Flame;
    case "edge":
      return Waves;
    case "opera":
      return Circle;
    default:
      return Globe;
  }
}

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
              {devices.map((device, index) => {
                const DeviceIcon = deviceIcon(device.name);
                return (
                  <div
                    key={device.name}
                    className="flex items-center gap-2 text-xs"
                  >
                    <DeviceIcon
                      className="h-3.5 w-3.5 shrink-0"
                      style={{
                        color: DEVICE_COLORS[index % DEVICE_COLORS.length],
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
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Globe className="h-3.5 w-3.5" />
              Browsers
            </p>
            {browsers.map((browser, index) => {
              const browserTotal = sumCounts(browsers);
              const pct =
                browserTotal > 0
                  ? Math.round((browser.count / browserTotal) * 100)
                  : 0;
              const BrowserIcon = browserIcon(browser.name);
              return (
                <div key={browser.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <BrowserIcon
                        className="h-3.5 w-3.5"
                        style={{
                          color: BROWSER_COLORS[index % BROWSER_COLORS.length],
                        }}
                      />
                      {browser.name}
                    </span>
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
