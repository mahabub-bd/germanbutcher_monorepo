"use client";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface ActiveStatusToggleProps {
  isActive: boolean;
  /** This row's toggle is in flight — disables the switch, shows an ellipsis. */
  disabled?: boolean;
  onToggle: () => void;
  /** Item name for the accessible label and title. */
  label: string;
  /** On/off text next to the switch. Default: Active/Inactive. */
  labels?: { on: string; off: string };
  className?: string;
}

/**
 * Active/Inactive switch shown in admin list rows. Green when active, red
 * when inactive, with a matching text label.
 */
export function ActiveStatusToggle({
  isActive,
  disabled,
  onToggle,
  label,
  labels = { on: "Active", off: "Inactive" },
  className,
}: ActiveStatusToggleProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Switch
        checked={isActive}
        disabled={disabled}
        onCheckedChange={onToggle}
        aria-label={`Toggle ${label} active status`}
        title={`Toggle ${label} active status`}
        className="data-[state=checked]:bg-green-700 data-[state=unchecked]:bg-red-700 cursor-pointer data-[state=checked]:hover:bg-green-800 data-[state=unchecked]:hover:bg-red-800"
      />
      <span
        className={cn(
          "text-xs font-medium",
          disabled
            ? "text-muted-foreground"
            : isActive
              ? "text-green-700 dark:text-green-400"
              : "text-red-700 dark:text-red-400"
        )}
      >
        {disabled ? "..." : isActive ? labels.on : labels.off}
      </span>
    </div>
  );
}
