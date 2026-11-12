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
        "flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium whitespace-nowrap",
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
        "flex flex-row items-center gap-1.5 sm:gap-2 px-2.5 py-3 sm:py-2.5 rounded-lg transition border relative overflow-hidden",
        "border-gray-200 dark:border-gray-700",
        "hover:shadow-sm active:scale-[0.98] sm:hover:scale-[1.02]",
        "w-full",
        gradient || "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700",
        className
      )}
    >
      {/* Icon */}
      <div className="p-1.5 rounded-md bg-white/50 dark:bg-black/20 shrink-0">
        <Icon className={cn("w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0", color)} />
      </div>

      {/* Title — truncates instead of wrapping */}
      <h4
        className="min-w-0 flex-1 text-xs lg:text-sm font-medium lg:font-semibold text-gray-800 dark:text-gray-200 leading-snug truncate"
        title={title}
      >
        {title}
      </h4>

      {/* Value + badge — never squeezed */}
      <div className="flex items-center gap-1.5 shrink-0 relative z-10">
        <span className="text-base font-bold text-gray-900 dark:text-white whitespace-nowrap drop-shadow-sm">
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
