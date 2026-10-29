import type { ReactNode } from "react";

const DEFAULT_CLASS = "md:p-4 p-2 space-y-6 rounded-sm";


export function AdminPageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className ?? DEFAULT_CLASS}>{children}</div>;
}
