import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface BadgeProps {
  children: React.ReactNode;
  color?: "success" | "warning" | "danger" | "info" | "default";
}

function Badge({ children, color = "default" }: BadgeProps) {
  const colorClasses = {
    success:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    warning:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] sm:text-[12px] font-medium whitespace-nowrap",
        colorClasses[color]
      )}
    >
      {children}
    </div>
  );
}

interface StatusCardProps {
  className?: string;
  title: string;
  value: number | string;
  icon: LucideIcon;
  href?: string;
  color?: string;
  gradient?: string;
  badge?: {
    icon?: LucideIcon;
    text: string;
    color?: "success" | "warning" | "danger" | "info" | "default";
  };
  /** Renders a thin percentage progress bar along the card's bottom edge. */
  progress?: {
    percent: number;
    /** Tailwind class for the filled portion, e.g. "bg-green-500". */
    barClass: string;
  };
}

export function StatusCard({
  className,
  title,
  value,
  icon: Icon,
  href = "#",
  color = "text-gray-700 dark:text-gray-300",
  gradient,
  badge,
  progress,
}: StatusCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-start 2xl:flex-row 2xl:items-center gap-2 sm:gap-2 p-2.5 sm:p-3 2xl:p-4 rounded-lg transition border relative overflow-hidden",
        "border-gray-200 dark:border-gray-700",
        "hover:shadow-sm active:scale-[0.98] sm:hover:scale-[1.02]",
        "w-full",
        gradient || "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700",
        className
      )}
    >
      {/* Left Section */}
      <div className="flex items-center gap-2 sm:gap-2 lg:gap-1.5 relative z-10 w-full sm:w-auto lg:w-full 2xl:w-auto min-w-0">
        <div className="p-1.5 lg:p-1 rounded-md bg-white/50 dark:bg-black/20 shrink-0">
          <Icon className={cn("w-3.5 h-3.5 lg:w-3 lg:h-3 2xl:w-4 2xl:h-4 shrink-0", color)} />
        </div>
        {/* Wrap instead of truncate so narrow 7-column layouts show the full title */}
        <h4 className="min-w-0 text-xs sm:text-xs lg:text-[11px] 2xl:text-base font-medium text-gray-800 dark:text-gray-200 leading-snug wrap-break-word">
          {title}
        </h4>
      </div>

      {/* Right Section */}
      <div className="flex items-center justify-between sm:justify-end lg:justify-between 2xl:justify-end gap-1 sm:gap-2 relative z-10 w-full sm:w-auto lg:w-full 2xl:w-auto">
        <span className="text-sm sm:text-base lg:text-sm 2xl:text-base font-bold text-gray-900 dark:text-white whitespace-nowrap drop-shadow-sm">
          {value}
        </span>

        {badge && (
          <Badge color={badge.color}>
            {badge.icon && <badge.icon className="w-3 h-3 mr-1" />}
            {badge.text}
          </Badge>
        )}
      </div>

      {/* Percentage progress bar along the bottom edge */}
      {progress && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gray-200/70 dark:bg-gray-700/70">
          <div
            className={cn("h-full transition-[width] duration-500", progress.barClass)}
            style={{
              width: `${Math.min(100, Math.max(0, progress.percent))}%`,
            }}
          />
        </div>
      )}
    </Link>
  );
}
