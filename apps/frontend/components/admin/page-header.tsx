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
}

export function PageHeader({
  title,
  description,
  titleIcon,
  actionLabel,
  actionHref,
  actionIcon = <Plus className="mr-2 h-4 w-4" />,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex flex-row items-center justify-between mb-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          {titleIcon}
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {actionHref && actionLabel ? (
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href={actionHref}>
              {actionIcon} {actionLabel}
            </Link>
          </Button>
          {children}
        </div>
      ) : children ? (
        <div className="flex items-center gap-2">{children}</div>
      ) : null}
    </div>
  );
}
