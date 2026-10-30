"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/utils";
import { fetchProtectedData, postData } from "@/utils/api-utils";
import type { ContactMessage, ContactMessageReply } from "@/utils/types";
import { CheckCheck, Loader2, Package, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SUPPORT_STATUS_BADGES } from "@/components/user-account/support-modals";

/** One message in the conversation view. */
interface ThreadEntry {
  side: "customer" | "admin";
  text: string;
  at: string;
}

/**
 * Modal showing one existing ticket as a conversation: the customer's original
 * message, the support team's replies, and a composer so the customer can
 * keep the conversation going after support has answered.
 */
export function TicketViewModal({
  ticket,
  onClose,
}: {
  ticket: ContactMessage | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [replies, setReplies] = useState<ContactMessageReply[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  /** Mirrors ticket.contactStatus - a sent reply moves the ticket to in progress. */
  const [status, setStatus] = useState<ContactMessage["contactStatus"] | null>(
    null
  );

  const ticketId = ticket?.id;
  useEffect(() => {
    if (!ticketId) return;
    let cancelled = false;
    setIsLoadingReplies(true);
    fetchProtectedData<ContactMessageReply[]>(
      `contact-messages/${ticketId}/replies`
    )
      .then((data) => {
        if (!cancelled) setReplies(data ?? []);
      })
      .catch((error) => {
        console.error("Error loading ticket replies:", error);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingReplies(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  if (!ticket) return null;

  const activeStatus = status ?? ticket.contactStatus;
  const badge =
    SUPPORT_STATUS_BADGES[activeStatus] ?? {
      label: activeStatus,
      className: "rounded-full bg-gray-100 text-gray-600",
    };
  // Legacy tickets were answered only by email (responseNotes) before the
  // thread table existed - surface that note when the thread has no admin entry.
  const hasAdminThreadReply = replies.some(
    (reply) => reply.senderType === "admin"
  );
  const canReply = activeStatus !== "closed";

  const entries: ThreadEntry[] = [
    { side: "customer", text: ticket.message, at: ticket.createdAt },
    ...(ticket.responseNotes && !hasAdminThreadReply
      ? [
          {
            side: "admin" as const,
            text: ticket.responseNotes,
            at: ticket.updatedAt,
          },
        ]
      : []),
    ...replies.map((reply) => ({
      side: reply.senderType,
      text: reply.message,
      at: reply.createdAt,
    })),
  ];

  const handleSendReply = async () => {
    const text = replyText.trim();
    if (!text) return;
    setIsSendingReply(true);
    try {
      const result = await postData<ContactMessageReply>(
        `contact-messages/${ticket.id}/replies`,
        { message: text }
      );
      const created = result?.data;
      if (created) setReplies((prev) => [...prev, created]);
      setReplyText("");
      if (activeStatus !== "in_progress") setStatus("in_progress");
      // The list behind the modal shows the (now in progress) status badge.
      router.refresh();
      toast.success("Reply sent");
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send reply");
    } finally {
      setIsSendingReply(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[92dvh] flex-col overflow-hidden sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 pr-6">
            Ticket
            <span className={`px-2.5 py-0.5 text-xs ${badge.className}`}>
              {badge.label}
            </span>
          </DialogTitle>
          <DialogDescription className="mt-1">
            Opened {formatDateTime(ticket.createdAt)}
          </DialogDescription>
        </DialogHeader>

        {ticket.orderReference && (
          <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 font-mono text-xs text-gray-600">
            <Package className="h-3.5 w-3.5" />
            {ticket.orderReference}
          </p>
        )}

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {isLoadingReplies && (
            <p className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading conversation
            </p>
          )}
          {entries.map((entry, index) => {
            const isCustomer = entry.side === "customer";
            return (
              <div
                key={index}
                className={
                  isCustomer
                    ? "rounded-xl border border-gray-200 bg-gray-50 p-3"
                    : "rounded-xl border border-green-200 bg-green-50 p-3"
                }
              >
                <p
                  className={`mb-1 flex items-center justify-between text-[11px] font-semibold tracking-wide uppercase ${
                    isCustomer ? "text-gray-500" : "text-green-700"
                  }`}
                >
                  {isCustomer ? "You" : "Support team"}
                  {!isCustomer && (
                    <CheckCheck className="h-3.5 w-3.5 text-green-600" />
                  )}
                </p>
                <p
                  className={`text-sm leading-relaxed wrap-break-word whitespace-pre-wrap ${
                    isCustomer ? "text-gray-700" : "text-green-900"
                  }`}
                >
                  {entry.text}
                </p>
                <p
                  className={`mt-1.5 text-right text-[11px] ${
                    isCustomer ? "text-gray-400" : "text-green-700/70"
                  }`}
                >
                  {formatDateTime(entry.at)}
                </p>
              </div>
            );
          })}
          {!isLoadingReplies && !canReply && (
            <p className="rounded-xl border border-dashed border-gray-200 bg-white p-3 text-sm text-gray-500">
              This ticket is closed. Open a new message for anything else.
            </p>
          )}
        </div>

        {canReply && (
          <div className="shrink-0 border-t border-gray-200 pt-3">
            <div className="flex items-end gap-2">
              <div className="flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={isSendingReply}
                  rows={2}
                  placeholder="Write a reply"
                  className="min-h-11 resize-none border-0 bg-transparent px-3 py-2 text-sm shadow-none focus-visible:border-0 focus-visible:ring-0"
                />
              </div>
              <Button
                size="icon"
                aria-label="Send reply"
                title="Send reply"
                onClick={handleSendReply}
                disabled={isSendingReply || !replyText.trim()}
                className="size-10 shrink-0 rounded-full"
              >
                {isSendingReply ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="mt-1.5 text-[11px] text-gray-400">
              Replies are delivered to the support team instantly.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
