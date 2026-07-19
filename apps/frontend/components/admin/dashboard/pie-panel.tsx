import { formatCurrencyEnglish } from "@/lib/utils";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface PieDataItem {
  name: string;
  value: number;
  color: string;
  percentage: number;
  label?: string; // Optional custom label for tooltips (e.g., "Revenue", "Orders")
}

interface PiePanelProps {
  title: string;
  subtitle?: string;
  data: PieDataItem[];
  showCurrency?: boolean; // Format values as currency
  size?: "sm" | "md" | "lg"; // Chart size variant
  donut?: boolean; // Show as donut chart
}

const CHART_CONFIG = {
  sm: { height: 180, outerRadius: 60, innerRadius: 0 },
  md: { height: 220, outerRadius: 80, innerRadius: 0 },
  lg: { height: 280, outerRadius: 100, innerRadius: 0 },
};

const DONUT_INNER_RADIUS = {
  sm: 30,
  md: 45,
  lg: 60,
};

export function PiePanel({
  title,
  subtitle,
  data,
  showCurrency = false,
  size = "md",
  donut = false,
}: PiePanelProps) {
  const config = CHART_CONFIG[size];
  const innerRadius = donut ? DONUT_INNER_RADIUS[size] : config.innerRadius;

  // Custom tooltip with e-commerce styling
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const item = data.payload;
      const displayValue = showCurrency
        ? formatCurrencyEnglish(data.value)
        : data.value.toLocaleString();

      return (
        <div className="rounded-sm border bg-white dark:bg-gray-800 p-3 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-semibold text-base">{data.name}</span>
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">
            {item.label || "Value"}: {displayValue}
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">
            {data.payload.percentage.toFixed(1)}%
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom label renderer
  const renderLabel = ({ name, percentage }: any) => {
    const shouldShow = percentage > (size === "sm" ? 8 : size === "md" ? 6 : 5);
    if (!shouldShow) return "";

    return (
      <tspan
        style={{
          fontSize: size === "sm" ? "12px" : size === "md" ? "14px" : "16px",
          fontWeight: 500,
        }}
      >
        {name} {percentage.toFixed(1)}%
      </tspan>
    );
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="mb-3">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={config.height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            outerRadius={config.outerRadius}
            innerRadius={innerRadius}
            paddingAngle={donut ? 2 : 0}
            label={renderLabel}
            labelLine={false}
            isAnimationActive={true}
            animationBegin={0}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke={donut ? "white" : "none"}
                strokeWidth={2}
                className="transition-opacity duration-200 hover:opacity-80"
                style={{ cursor: "pointer" }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={10}
            wrapperStyle={{
              fontSize: size === "sm" ? "12px" : size === "md" ? "14px" : "16px",
              paddingTop: "8px",
            }}
            formatter={(value: string) => {
              const item = data.find((d) => d.name === value);
              const percentage = item?.percentage.toFixed(1) || "0";
              return (
                <span className="text-gray-700 dark:text-gray-300">
                  {value} ({percentage}%)
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      {data.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 dark:text-gray-400">Total:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {showCurrency
                ? formatCurrencyEnglish(
                    data.reduce((sum, item) => sum + item.value, 0)
                  )
                : data.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
