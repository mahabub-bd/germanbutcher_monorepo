"use client";

import { AnalyticsCardHeader, AnalyticsRangeBadge } from "@/components/admin/analytics/analytics-card-header";
import { AnalyticsEmptyState } from "@/components/admin/analytics/analytics-empty-state";
import { ChartTooltip } from "@/components/admin/analytics/chart-tooltip";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface DeviceChartProps {
  data: DeviceBreakdownData;
  /** Aggregation window shown in the header, e.g. "24 hours". */
  rangeLabel?: string;
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

export function DeviceChart({
  data,
  rangeLabel = "selected period",
}: DeviceChartProps) {
  const devices = data.devices.filter((d) => d.count > 0);
  const browsers = data.browsers.filter((b) => b.count > 0);
  const deviceTotal = sumCounts(devices);
  const browserTotal = sumCounts(browsers);
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
          action={<AnalyticsRangeBadge label={rangeLabel} />}
        />
        <CardContent>
          <AnalyticsEmptyState
            icon={MonitorSmartphone}
            title="No device data yet"
            description="Device and browser breakdown will appear once there is traffic"
          />
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
        action={<AnalyticsRangeBadge label={rangeLabel} />}
      />
      <CardContent className="flex flex-1 flex-col gap-5">
        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
          {/* Device split — donut with total in the hub. */}
          <div className="relative mx-auto size-30">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={devices}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={38}
                  outerRadius={56}
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
                <Tooltip content={<ChartTooltip valueLabel="Visits" />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold leading-none tabular-nums">
                {deviceTotal.toLocaleString()}
              </span>
              <span className="mt-1 text-[10px] leading-none text-muted-foreground">
                visits
              </span>
            </div>
          </div>

          {/* Device list */}
          <div className="space-y-1.5">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
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
                  <span className="min-w-0 flex-1 truncate font-medium">
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
          </div>
        </div>

        {/* Browser split — compact bars */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <Globe className="size-3.5" />
              Browsers
            </p>
            <span className="text-[11px] text-muted-foreground">
              {browsers.length} detected
            </span>
          </div>
          {browsers.map((browser, index) => {
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
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {browser.name}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {browser.count.toLocaleString()}
                  </span>
                  <span className="w-9 text-right tabular-nums text-muted-foreground">
                    {pct}%
                  </span>
                </div>
                <div className="ml-8 h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full transition-[width] duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
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

        {(topDevice || topBrowser) && (
          <div className="mt-auto rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
            Mostly {topDevice?.name.toLowerCase() ?? "unknown"}
            {topBrowser ? ` · ${topBrowser.name} leads browsers` : ""}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
