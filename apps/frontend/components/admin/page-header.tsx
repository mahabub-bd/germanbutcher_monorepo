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
        "mb-6 flex flex-row items-center justify-between gap-3",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-[1.375rem] font-bold sm:text-2xl">
          {titleIcon}
          <span className="truncate">{title}</span>
        </h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground hidden sm:block">
            {description}
          </p>
        )}
      </div>

      {actionHref && actionLabel ? (
        <div className="flex shrink-0 items-center gap-2">
          <Button asChild>
            <Link href={actionHref}>
              {actionIcon}
              <span className="hidden sm:inline">{actionLabel}</span>
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
