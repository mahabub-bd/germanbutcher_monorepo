"use client";

import {
  getPriorityBadge,
  getStatusBadge,
  ticketNo,
  timeAgo,
} from "@/components/admin/inbox/ticket-shared";
import type { ContactMessage } from "@/utils/types";

/** Card-style ticket list (first line of the message acts as the subject). */
export function TicketList({
  messages,
  onView,
}: {
  messages: ContactMessage[];
  onView: (message: ContactMessage) => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-neutral-800 divide-y divide-gray-100 dark:divide-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
      {messages.map((message) => {
        const firstLine = message.message.split("\n")[0] ?? "";
        const subject =
          firstLine.length > 70 ? `${firstLine.slice(0, 70)}…` : firstLine;
        const preview =
          message.message.length > 120
            ? `${message.message.slice(0, 120)}…`
            : message.message;

        return (
          <div
            key={message.id}
            onClick={() => onView(message)}
            className="flex items-start gap-3 px-3 py-3 hover:bg-gray-50 dark:hover:bg-neutral-800/60 cursor-pointer transition-colors sm:gap-4 sm:px-4 sm:py-4"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-sm font-bold text-blue-700 dark:text-blue-300">
              {message.name?.charAt(0).toUpperCase() || "?"}
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {subject}
                </p>
                <span className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap shrink-0">
                  {timeAgo(message.createdAt)}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {preview}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1.5 flex-wrap">
                <span className="font-medium">{ticketNo(message.id)}</span>
                <span>•</span>
                <span>{message.name}</span>
                {message.source && (
                  <>
                    <span>•</span>
                    <span className="capitalize">{message.source}</span>
                  </>
                )}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                {getPriorityBadge(message.priority)}
                {getStatusBadge(message.contactStatus)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
