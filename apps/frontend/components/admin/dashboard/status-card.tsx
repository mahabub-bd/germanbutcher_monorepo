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
}

export function StatusCard({
  title,
  value,
  icon: Icon,
  href = "#",
  color = "text-gray-700 dark:text-gray-300",
  gradient,
  badge,
}: StatusCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg transition border relative overflow-hidden",
        "border-gray-200 dark:border-gray-700",
        "hover:shadow-sm active:scale-[0.98] sm:hover:scale-[1.02]",
        "w-full",
        gradient || "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
      )}
    >
      {/* Left Section */}
      <div className="flex items-center gap-2 sm:gap-3 relative z-10 w-full sm:w-auto">
        <div className="p-1.5 rounded-md bg-white/50 dark:bg-black/20 shrink-0">
          <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5 shrink-0", color)} />
        </div>
        <h4 className="text-xs sm:text-sm md:text-base font-medium text-gray-800 dark:text-gray-200 truncate">
          {title}
        </h4>
      </div>

      {/* Right Section */}
      <div className="flex items-center justify-between sm:justify-end gap-2 relative z-10 w-full sm:w-auto">
        <span className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap drop-shadow-sm">
          {value}
        </span>

        {badge && (
          <Badge color={badge.color}>
            {badge.icon && <badge.icon className="w-3 h-3 mr-1" />}
            {badge.text}
          </Badge>
        )}
      </div>
    </Link>
  );
}
