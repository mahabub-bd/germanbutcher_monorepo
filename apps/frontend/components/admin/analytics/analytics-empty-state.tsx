import type { LucideIcon } from "lucide-react";

interface AnalyticsEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

/** Consistent empty state used inside analytics cards. */
export function AnalyticsEmptyState({
  icon: Icon,
  title,
  description,
}: AnalyticsEmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center py-10 text-center">
      <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </span>
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="mt-1 max-w-56 text-xs text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
