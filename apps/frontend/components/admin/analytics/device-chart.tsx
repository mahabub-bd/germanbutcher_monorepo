"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AnalyticsCardHeader } from "@/components/admin/analytics/analytics-card-header";
import type { DeviceBreakdownData, NamedCount } from "@/utils/types";
import {
  Circle,
  Compass,
  Flame,
  Globe,
  Monitor,
  MonitorSmartphone,
  Smartphone,
  Tablet,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

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

/** Soft tinted background for an icon chip (hex + alpha keeps the exact hue). */
function tintStyle(color: string) {
  return { backgroundColor: `${color}1a`, color };
}

export function DeviceChart({ data }: DeviceChartProps) {
  const devices = data.devices.filter((d) => d.count > 0);
  const browsers = data.browsers.filter((b) => b.count > 0);
  const deviceTotal = sumCounts(devices);
  const topDevice = devices.reduce<NamedCount | null>(
    (max, d) => (!max || d.count > max.count ? d : max),
    null,
  );
  const topBrowser = browsers.reduce<NamedCount | null>(
    (max, b) => (!max || b.count > max.count ? b : max),
    null,
  );

  if (deviceTotal === 0) {
    return (
      <Card className="h-full rounded-sm">
        <AnalyticsCardHeader
          title="Devices"
          description="Mobile vs desktop, plus browser split"
          icon={MonitorSmartphone}
          tone="violet"
        />
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
              <MonitorSmartphone className="size-5 text-muted-foreground" />
            </span>
            <p className="text-sm font-medium">No device data yet</p>
            <p className="mt-1 max-w-56 text-xs text-muted-foreground">
              Device and browser breakdown will appear once there is traffic
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full rounded-sm">
      <AnalyticsCardHeader
        title="Devices"
        description="Mobile vs desktop, plus browser split"
        icon={MonitorSmartphone}
        tone="violet"
        action={
          <>
            <div className="text-lg font-bold leading-tight tabular-nums">
              {deviceTotal.toLocaleString()}
            </div>
            <div className="text-[11px] leading-tight text-muted-foreground">
              total visits
            </div>
          </>
        }
      />
      <CardContent>
        {/* Donut + device list pair from sm; the browser column joins as a
            third track only on large desktops — its 240px minimum would
            overflow the narrower laptop card */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-[auto_minmax(150px,1fr)] 2xl:grid-cols-[auto_minmax(170px,1fr)_minmax(240px,1.4fr)] sm:items-center">
          {/* Device split — donut. Fixed width: ResponsiveContainer measures
              its parent, and an auto grid track would collapse it to 0. */}
          <div className="mx-auto w-35">
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={devices}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={42}
                  outerRadius={58}
                  paddingAngle={2}
                  cornerRadius={3}
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
          </div>

          {/* Device list */}
          <div className="space-y-1.5">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <MonitorSmartphone className="size-3.5" />
              Devices
            </p>
            {devices.map((device, index) => {
              const DeviceIcon = deviceIcon(device.name);
              const color = DEVICE_COLORS[index % DEVICE_COLORS.length];
              return (
                <div
                  key={device.name}
                  className="flex items-center gap-2.5 rounded-lg border bg-card px-2.5 py-2 text-xs"
                >
                  <span
                    className="flex size-6 shrink-0 items-center justify-center rounded-md"
                    style={tintStyle(color)}
                  >
                    <DeviceIcon className="size-3" />
                  </span>
                  <span className="flex-1 truncate font-medium">
                    {device.name}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {device.count.toLocaleString()}
                  </span>
                  <span className="w-9 text-right tabular-nums text-muted-foreground">
                    {Math.round((device.count / deviceTotal) * 100)}%
                  </span>
                </div>
              );
            })}
            {topDevice && (
              <p className="px-1 pt-0.5 text-[11px] text-muted-foreground">
                Mostly visited from {topDevice.name.toLowerCase()}
              </p>
            )}
          </div>

          {/* Browser split — bars (full row below 2xl, third track above) */}
          <div className="space-y-2.5 sm:col-span-2 2xl:col-span-1">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Globe className="size-3.5" />
              Browsers
            </p>
            {browsers.map((browser, index) => {
              const browserTotal = sumCounts(browsers);
              const pct =
                browserTotal > 0
                  ? Math.round((browser.count / browserTotal) * 100)
                  : 0;
              const BrowserIcon = browserIcon(browser.name);
              const color = BROWSER_COLORS[index % BROWSER_COLORS.length];
              return (
                <div key={browser.name}>
                  <div className="mb-1 flex items-center gap-2 text-xs">
                    <span
                      className="flex size-6 shrink-0 items-center justify-center rounded-md"
                      style={tintStyle(color)}
                    >
                      <BrowserIcon className="size-3" />
                    </span>
                    <span className="flex-1 font-medium">{browser.name}</span>
                    <span className="font-semibold tabular-nums">
                      {browser.count.toLocaleString()}
                    </span>
                    <span className="w-9 text-right tabular-nums text-muted-foreground">
                      {pct}%
                    </span>
                  </div>
                  <div className="ml-8 h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
            {browsers.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No browser data yet
              </p>
            ) : (
              topBrowser && (
                <p className="pt-1 text-[11px] text-muted-foreground">
                  Most visits via {topBrowser.name}
                </p>
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
