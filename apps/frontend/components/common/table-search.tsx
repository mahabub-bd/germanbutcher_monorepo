"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface TableSearchProps
  extends Omit<React.ComponentProps<typeof Input>, "type"> {
  /** Classes for the wrapper div, e.g. width/flex sizing. */
  wrapperClassName?: string;
}

/**
 * Shared search input for admin list toolbars (orders, products, CRM, ...).
 * Renders a search icon inside the field; pass width via wrapperClassName.
 */
export function TableSearch({
  wrapperClassName,
  className,
  ...props
}: TableSearchProps) {
  return (
    <div className={cn("relative min-w-0", wrapperClassName)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        className={cn("h-8 pl-9", className)}
        {...props}
      />
    </div>
  );
}
