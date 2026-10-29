import type { ReactNode } from "react";

const DEFAULT_CLASS = "md:p-4 p-2 space-y-6 rounded-sm";

/**
 * Standard outer wrapper for admin pages. Pass `className` to override
 * the default padding/spacing (e.g. tighter order pages use `md:p-2 p-2`).
 */
export function AdminPageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className ?? DEFAULT_CLASS}>{children}</div>;
}
