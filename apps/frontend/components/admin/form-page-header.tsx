import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface FormPageHeaderProps {
  /** Optional heading shown on the left; omit for a bare back button. */
  title?: string;
  description?: string;
  /** List route the back button returns to. */
  backHref: string;
  /** Defaults to "Back". */
  backLabel?: string;
}

/** Shared header for admin add/edit form pages: title left, back button right. */
export function FormPageHeader({
  title,
  description,
  backHref,
  backLabel = "Back",
}: FormPageHeaderProps) {
  const hasTitle = Boolean(title || description);

  return (
    <div
      className={cn(
        "flex items-center",
        hasTitle ? "justify-between" : "justify-end"
      )}
    >
      {hasTitle && (
        <div>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </div>
      )}
      <Button asChild variant="default">
        <Link href={backHref}>{backLabel}</Link>
      </Button>
    </div>
  );
}
