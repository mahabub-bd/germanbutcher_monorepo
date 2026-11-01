import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { List } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface FormPageHeaderProps {
  /** Optional heading shown on the left; omit for a bare back button. */
  title?: string;
  /** @deprecated no longer rendered — kept so existing callers still compile. */
  description?: string;
  /** List route the back button returns to. */
  backHref: string;
  /** Defaults to "Back". */
  backLabel?: string;
  /** Optional chips (e.g. status badges) rendered beside the title. */
  children?: ReactNode;
}

/** Shared header for admin add/edit form pages: title left, back button right. */
export function FormPageHeader({
  title,
  backHref,
  backLabel = "Back",
  children,
}: FormPageHeaderProps) {
  const hasTitle = Boolean(title);

  return (
    <div
      className={cn(
        "flex items-center",
        hasTitle ? "justify-between" : "justify-end"
      )}
    >
      {hasTitle && (
        <div className="flex min-w-0 items-center gap-2">
          {title && <CardTitle className="truncate">{title}</CardTitle>}
          {children}
        </div>
      )}
      <Button
        asChild
        className="bg-primaryColor text-white hover:bg-primaryColor/90"
      >
        <Link href={backHref}>
          <List className="mr-2 h-4 w-4" />
          {backLabel}
        </Link>
      </Button>
    </div>
  );
}
