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
        className="data-[state=checked]:bg-green-700 data-[state=unchecked]:bg-red-700"
      />

    </div>
  );
}
