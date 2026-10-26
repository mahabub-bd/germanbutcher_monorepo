import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Optional icon rendered beside the title. */
  titleIcon?: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
  actionIcon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  titleIcon,
  actionLabel,
  actionHref,
  actionIcon = <Plus className="mr-2 h-4 w-4" />,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          {titleIcon}
          <span className="truncate">{title}</span>
        </h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {actionHref && actionLabel ? (
        <div className="flex shrink-0 items-center gap-2">
          <Button asChild>
            <Link href={actionHref}>
              {actionIcon} {actionLabel}
            </Link>
          </Button>
          {children}
        </div>
      ) : children ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {children}
        </div>
      ) : null}
    </div>
  );
}
