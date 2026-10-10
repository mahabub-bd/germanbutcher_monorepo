"use client";

import { NotificationPanel } from "@/components/notification-panel";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotification } from "@/hooks/use-notification";
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
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
          {notifications.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-semibold text-primaryColor">
              {notifications.length > 9 ? "9+" : notifications.length}
            </span>
          )}
        </div>
      </PopoverTrigger>
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
