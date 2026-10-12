"use client";

import { Badge } from "@/components/ui/badge";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { fetchProtectedData } from "@/utils/api-utils";
import type { ContactMessage } from "@/utils/types";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Mail,
  MessageSquare,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

// Compact status badge — mirrors the inbox page's badges in miniature.
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> Pending
        </Badge>
      );
    case "in_progress":
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> In Progress
        </Badge>
      );
    case "resolved":
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 text-green-600 border-green-600"
        >
          <CheckCircle className="h-3 w-3" /> Resolved
        </Badge>
      );
    case "closed":
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" /> Closed
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Header inbox quick-view. Mirrors the notification bell: bottom sheet on
 * mobile, right-anchored popover (same width) on desktop. The full management
 * UI lives on /admin/inbox — "View all" navigates there.
 */
export function InboxModal({
  unreadCount,
  triggerClassName,
}: {
  unreadCount: number;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!open) return;

    let active = true;
    const load = async () => {
      setIsLoading(true);
      try {
        // findAll returns the envelope itself, so fetchProtectedData's
        // unwrap leaves the plain message array
        const response = await fetchProtectedData<ContactMessage[]>(
          "contact-messages?page=1&limit=5"
        );
        if (active) {
          setMessages(Array.isArray(response) ? response : []);
        }
      } catch {
        if (active) setMessages([]);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [open]);

  const trigger = (
    <Button
      variant="ghost"
      size="icon"
      title="Inbox"
      className={`relative ${triggerClassName ?? ""}`}
    >
      <MessageSquare className="size-4" />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-semibold text-primaryColor">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Button>
  );

  const messageList = (
    <div className="flex-1 overflow-y-auto min-h-0">
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading messages...
        </div>
      ) : messages.length === 0 ? (
        <div className="py-10 text-center">
          <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No messages yet</p>
        </div>
      ) : (
        <ul className="divide-y">
          {messages.map((message) => (
            <li key={message.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">
                      {message.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {message.message}
                  </p>
                </div>
                <StatusBadge status={message.contactStatus} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const footer = (
    <div className="border-t p-2">
      <Button
        asChild
        variant="ghost"
        className="w-full text-sm font-medium text-primaryColor hover:text-primaryColor"
        onClick={() => setOpen(false)}
      >
        <Link href="/admin/inbox">View all messages</Link>
      </Button>
    </div>
  );

  // Mobile: bottom sheet, same presentation as the notification panel
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent
          side="bottom"
          showClose={false}
          className="h-[85dvh] rounded-t-2xl p-0 bg-transparent shadow-none border-0"
          onClickCapture={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          <SheetTitle className="sr-only">Inbox</SheetTitle>
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-muted" />
          <div className="min-h-0 flex-1 mt-2 px-3 pb-3">
            <div className="bg-white rounded-md shadow-md overflow-hidden h-full flex flex-col">
              <div className="flex items-center gap-2 px-4 py-3 border-b">
                <span className="text-base font-semibold">Inbox</span>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="rounded-full px-1.5">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </div>
              {messageList}
              {footer}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: popover anchored under the bell — same size/position as the
  // notification popover
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
        align="end"
        side="bottom"
        collisionPadding={16}
      >
        <div className="flex flex-col max-h-[calc(80vh-2px)]">
          <div className="flex items-center gap-2 px-4 py-3 border-b">
            <span className="text-base font-semibold">Inbox</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="rounded-full px-1.5">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </div>
          {messageList}
          {footer}
        </div>
      </PopoverContent>
    </Popover>
  );
}
