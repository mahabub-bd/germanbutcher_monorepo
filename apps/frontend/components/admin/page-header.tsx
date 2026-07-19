import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

interface PageHeaderProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  actionIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  actionLabel,
  actionHref,
  actionIcon = <Plus className="mr-2 h-4 w-4" />,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex flex-row items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
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
