import { Badge } from "@/components/ui/badge";
import MiniSparkline from "@/components/ui/mini-sparkline";
import { cn } from "@/lib/utils";
import type React from "react";

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  count?: string;
  description?: string;

  badge?: {
    icon?: React.ComponentType<{ className?: string }>;
    text: string;
    color?: "success" | "warning" | "danger" | "info" | "default";
  };

  sparklineData?: number[];

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

  className?: string;
}

export default function StatsCard({
  icon: Icon,
  title,
  value,
  count,
  description,
  badge,
  sparklineData,
  bgColor = "default",
  className,
}: StatCardProps) {
  const bgColorClasses: Record<string, string> = {
    blue: "from-blue-50 to-blue-100 dark:from-blue-950/15 dark:to-blue-900/5",
    green:
      "from-green-50 to-green-100 dark:from-green-950/15 dark:to-green-900/5",
    purple:
      "from-purple-50 to-purple-100 dark:from-purple-950/15 dark:to-purple-900/5",
    orange:
      "from-orange-50 to-orange-100 dark:from-orange-950/15 dark:to-orange-900/5",
    pink: "from-pink-50 to-pink-100 dark:from-pink-950/15 dark:to-pink-900/5",
    indigo:
      "from-indigo-50 to-indigo-100 dark:from-indigo-950/15 dark:to-indigo-900/5",
    violet:
      "from-violet-50 to-violet-100 dark:from-violet-950/15 dark:to-violet-900/5",
    amber:
      "from-amber-50 to-amber-100 dark:from-amber-950/15 dark:to-amber-900/5",
    red: "from-red-50 to-red-100 dark:from-red-950/15 dark:to-red-900/5",
    default: "bg-white dark:bg-white/[0.03]",
  };

  const sparklineColor =
    bgColor === "red" ? "#ef4444" : bgColor === "amber" ? "#f59e0b" : "#22c55e";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800",
        "p-3 sm:p-4 bg-gradient-to-br transition hover:shadow-sm",
        "flex flex-col w-full min-h-[100px]",
        bgColorClasses[bgColor],
        className
      )}
    >
      {/* Background Icon */}
      <div className="absolute -top-2 -right-2 opacity-[0.05] dark:opacity-[0.08]">
        <Icon className="w-16 h-16 text-gray-900 dark:text-white" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs sm:text-sm font-semibold text-primaryColor dark:text-white">
            {title}
          </p>

          <p className="mt-1 text-base sm:text-lg lg:text-xl font-bold text-gray-800 dark:text-gray-300 leading-none">
            {count !== undefined ? `${value} / ${count}` : value}
          </p>
        </div>

        {badge && (
          <Badge color={badge.color}>
            {badge.icon && <badge.icon className="w-3 h-3" />}
            {badge.text}
          </Badge>
        )}
      </div>

      {/* Sparkline */}
      {sparklineData && (
        <div className="mt-2">
          <MiniSparkline data={sparklineData} stroke={sparklineColor} />
        </div>
      )}

      {/* Description */}
      {description && (
        <p className="mt-1 text-[10px] sm:text-xs text-gray-700 dark:text-gray-400">
          {description}
        </p>
      )}
    </div>
  );
}
