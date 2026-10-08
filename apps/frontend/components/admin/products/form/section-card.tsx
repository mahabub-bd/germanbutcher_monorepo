import type { LucideIcon } from "lucide-react";
import type React from "react";

import { cn } from "@/lib/utils";

interface SectionCardProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  className?: string;
  action?: React.ReactNode;
  headerCenter?: React.ReactNode;
  children?: React.ReactNode;
}

export function SectionCard({
  icon: Icon,
  title,
  subtitle,
  className,
  action,
  headerCenter,
  children,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "flex h-full flex-col rounded-xl border bg-card shadow-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-4.5 w-4.5 text-foreground" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">{title}</h3>
            {subtitle ? (
              <p className="truncate text-xs text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        {headerCenter ? (
          <div className="flex min-w-0 flex-1 justify-center px-2">
            {headerCenter}
          </div>
        ) : null}
        {action ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {action}
          </div>
        ) : null}
      </div>
      <div className="flex-1 space-y-4 p-4 sm:p-6">{children}</div>
    </section>
  );
}
