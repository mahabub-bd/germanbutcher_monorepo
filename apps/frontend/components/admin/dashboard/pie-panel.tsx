import { formatCurrencyEnglish } from "@/lib/utils";
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
}

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
}: PiePanelProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const chartData = data.filter((item) => item.value > 0);
  const displayValue = (value: number) =>
    showCurrency ? formatCurrencyEnglish(value) : value.toLocaleString();

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload as PieDataItem;
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          {item.name}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          {item.label || "Value"}: {displayValue(item.value)} · {item.percentage.toFixed(1)}%
        </p>
      </div>
    );
  };

  return (
    <section className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <header className="mb-1.5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </header>

      <div className="relative">
        <ResponsiveContainer width="100%" height={HEIGHTS[size]}>
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
            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Total</span>
            <span className="max-w-[72px] truncate text-xs font-bold tabular-nums text-gray-900 dark:text-white">
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
            <span className="truncate text-gray-600 dark:text-gray-300">{item.name}</span>
            <span className="ml-auto shrink-0 tabular-nums text-gray-500 dark:text-gray-400">
              {item.percentage.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
