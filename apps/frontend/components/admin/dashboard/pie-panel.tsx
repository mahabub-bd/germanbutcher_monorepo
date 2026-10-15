import { cn, formatCurrencyEnglish } from "@/lib/utils";
import type React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface PieDataItem {
  name: string;
  value: number;
  color: string;
  percentage: number;
  label?: string;
}

interface PiePanelProps {
  title: string;
  subtitle?: string;
  data: PieDataItem[];
  showCurrency?: boolean;
  size?: "sm" | "md" | "lg";
  donut?: boolean;
  compactLaptop?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  bgColor?:
    | "blue"
    | "green"
    | "purple"
    | "orange"
    | "pink"
    | "indigo"
    | "violet"
    | "amber"
    | "red"
    | "default";
}

const BG_COLOR_CLASSES: Record<string, string> = {
  blue: "from-blue-50 to-blue-100 dark:from-blue-950/15 dark:to-blue-900/5",
  green: "from-green-50 to-green-100 dark:from-green-950/15 dark:to-green-900/5",
  purple: "from-purple-50 to-purple-100 dark:from-purple-950/15 dark:to-purple-900/5",
  orange: "from-orange-50 to-orange-100 dark:from-orange-950/15 dark:to-orange-900/5",
  pink: "from-pink-50 to-pink-100 dark:from-pink-950/15 dark:to-pink-900/5",
  indigo: "from-indigo-50 to-indigo-100 dark:from-indigo-950/15 dark:to-indigo-900/5",
  violet: "from-violet-50 to-violet-100 dark:from-violet-950/15 dark:to-violet-900/5",
  amber: "from-amber-50 to-amber-100 dark:from-amber-950/15 dark:to-amber-900/5",
  red: "from-red-50 to-red-100 dark:from-red-950/15 dark:to-red-900/5",
  default: "bg-white dark:bg-white/[0.03]",
};

const HEIGHTS = { sm: 124, md: 164, lg: 208 };
const RADII = { sm: 45, md: 59, lg: 75 };
const INNER_RADII = { sm: 31, md: 41, lg: 52 };

export function PiePanel({
  title,
  subtitle,
  data,
  showCurrency = false,
  size = "md",
  donut = false,
  compactLaptop = false,
  icon: Icon,
  bgColor = "default",
}: PiePanelProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const chartData = data.filter((item) => item.value > 0);
  const displayValue = (value: number) =>
    showCurrency ? formatCurrencyEnglish(value) : value.toLocaleString();

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: { payload: PieDataItem }[];
  }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload as PieDataItem;
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          {item.name}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          {item.label || "Value"}: {displayValue(item.value)} · {Math.round(item.percentage)}%
        </p>
      </div>
    );
  };

  return (
    <section
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-linear-to-br p-4 shadow-sm dark:border-gray-800 xl:p-3 2xl:p-4",
        BG_COLOR_CLASSES[bgColor]
      )}
    >
      {/* Watermark icon */}
      {Icon && (
        <div className="pointer-events-none absolute -top-2 -right-2 opacity-[0.05] dark:opacity-[0.08]">
          <Icon className="w-16 h-16 text-gray-900 dark:text-white" />
        </div>
      )}

      <header className="relative mb-1.5 flex items-start gap-2">
        {Icon && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/70 text-gray-700 shadow-sm dark:bg-white/10 dark:text-gray-200">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">{subtitle}</p>}
        </div>
      </header>

      <div className={`relative ${compactLaptop ? "h-31 xl:h-26 2xl:h-31" : ""}`}>
        <ResponsiveContainer
          width="100%"
          height={compactLaptop ? "100%" : HEIGHTS[size]}
        >
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={RADII[size]}
              innerRadius={donut ? INNER_RADII[size] : 0}
              paddingAngle={donut ? 3 : 1}
              stroke="none"
              isAnimationActive
              animationDuration={650}
            >
              {chartData.map((item) => (
                <Cell key={item.name} fill={item.color} className="transition-opacity hover:opacity-80" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {donut && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Total</span>
            <span className="max-w-18 truncate text-sm font-extrabold tabular-nums text-gray-900 dark:text-white">
              {showCurrency
                ? `৳ ${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(total)}`
                : displayValue(total)}
            </span>
          </div>
        )}
        {!chartData.length && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">No data yet</div>
        )}
      </div>

      <ul className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1">
        {data.map((item) => (
          <li key={item.name} className="flex min-w-0 items-center gap-1.5 text-xs">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="truncate font-semibold text-gray-800 dark:text-gray-100">{item.name}</span>
            <span className="ml-auto shrink-0 font-semibold tabular-nums text-gray-700 dark:text-gray-200">
              {Math.round(item.percentage)}%
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
