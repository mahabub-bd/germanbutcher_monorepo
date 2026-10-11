"use client";

import { NotificationPanel } from "@/components/notification-panel";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useNotification } from "@/hooks/use-notification";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";
import { useState } from "react";

export function NotificationBell({
  buttonClassName,
}: {
  /** Extra classes for the trigger button (tailwind-merge resolves conflicts). */
  buttonClassName?: string;
}) {
  const { notifications } = useNotification();
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const badge =
    notifications.length > 0 ? (
      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-semibold text-primaryColor">
        {notifications.length > 9 ? "9+" : notifications.length}
      </span>
    ) : null;

  const trigger = (
    <div className="relative inline-flex">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "rounded-md bg-primaryColor py-2 px-4 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-primaryColor focus:opacity-90 focus:shadow-none active:bg-primaryColor active:opacity-90 hover:bg-primaryColor hover:opacity-90 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none",
          buttonClassName
        )}
      >
        <Bell className="h-4 w-4" />
      </Button>
      {badge}
    </div>
  );

  // Mobile: the near-viewport-wide popover can't anchor cleanly to the
  // header button, so present the panel as a bottom sheet instead.
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent
          side="bottom"
          showClose={false}
          className="h-[85dvh] rounded-t-2xl p-0"
          onClickCapture={(e) => {
            // Close when a link inside the panel ("View all", an order
            // number) is followed.
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          <SheetTitle className="sr-only">Notifications</SheetTitle>
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-muted" />
          <div className="min-h-0 flex-1">
            <NotificationPanel />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-[calc(100vw-2rem)] p-0",
          "md:w-[680px]",
          "max-h-[80vh]",
          "overflow-hidden"
        )}
        align="center"
        side="bottom"
      >
        <NotificationPanel />
      </PopoverContent>
    </Popover>
  );
}
