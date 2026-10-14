"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface RouteTab {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface RouteTabsProps {
  tabs: RouteTab[];
  className?: string;
}

/** Segmented control linking related admin routes; the current route is highlighted. */
export function RouteTabs({ tabs, className }: RouteTabsProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border bg-muted/40 p-1",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Button
            key={tab.href}
            asChild
            variant={isActive ? "default" : "ghost"}
            size="sm"
            className={cn(!isActive && "text-muted-foreground")}
          >
            <Link href={tab.href}>
              {tab.icon}
              {tab.label}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}
