"use client";

import {
  getPriorityBadge,
  getStatusBadge,
  ticketNo,
  timeAgo,
} from "@/components/admin/inbox/ticket-shared";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ContactMessage } from "@/utils/types";
import Image from "next/image";

/** Table-style ticket list (first line of the message acts as the subject). */
export function TicketList({
  messages,
  onView,
}: {
  messages: ContactMessage[];
  onView: (message: ContactMessage) => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
      <Table className="min-w-220 [&_td]:py-3 [&_th]:pb-3 [&_th]:pt-3">
        <TableHeader>
          <TableRow>
            <TableHead>Ticket</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {messages.map((message) => {
            const firstLine = message.message.split("\n")[0] ?? "";
            const subject =
              firstLine.length > 200 ? `${firstLine.slice(0, 200)}…` : firstLine;
            const avatar = message.user?.profilePhoto?.url ?? null;

            return (
              <TableRow
                key={message.id}
                onClick={() => onView(message)}
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800/60"
              >
                <TableCell className="font-mono text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {ticketNo(message.id)}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-3 min-w-0">
                    {avatar ? (
                      <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border bg-muted">
                        <Image
                          src={avatar}
                          alt={`${message.name}'s avatar`}
                          fill
                          className="object-contain"
                        />
                      </span>
                    ) : (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-sm font-bold text-blue-700 dark:text-blue-300">
                        {message.name?.charAt(0).toUpperCase() || "?"}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {message.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {message.email}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="max-w-80">
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {subject}
                  </p>
                </TableCell>

                <TableCell className="text-xs capitalize text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {message.source ?? "—"}
                </TableCell>

                <TableCell className="whitespace-nowrap">
                  {getPriorityBadge(message.priority)}
                </TableCell>

                <TableCell className="whitespace-nowrap">
                  {getStatusBadge(message.contactStatus)}
                </TableCell>

                <TableCell className="text-right text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                  {timeAgo(message.createdAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
