"use client";

import { ticketNo } from "@/components/admin/inbox/ticket-shared";
import { AccountPageHeader } from "@/components/user-account/account-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaginationComponent } from "@/components/common/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreateTicketModal,
  SUPPORT_STATUS_BADGES,
  type CreateTicketPayload,
  type SupportOrder,
} from "@/components/user-account/support-modals";
import { TicketViewModal } from "@/components/user-account/ticket-view-modal";
import { formatDateTime } from "@/lib/utils";
import { ContactMessage, PaginatedEnvelope } from "@/utils/types";
import { LifeBuoy, Package, Plus } from "lucide-react";
import { useState } from "react";

interface MySupportProps {
  messagesData: PaginatedEnvelope<ContactMessage>;
  user: { name?: string; email?: string; mobileNumber?: string };
  userId: string;
  currentPage: number;
  /** The customer's own orders — powers the optional order reference select. */
  orders?: SupportOrder[];
  onSubmitMessage: (payload: CreateTicketPayload) => Promise<void>;
}

const MySupport = ({
  messagesData,
  user,
  currentPage,
  orders = [],
  onSubmitMessage,
}: MySupportProps) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ContactMessage | null>(
    null
  );

  const messages = messagesData?.data ?? [];
  const totalMessages = messagesData?.total ?? 0;

  return (
    <div className="w-full">
      <AccountPageHeader
        title="Support"
        subtitle={`${totalMessages} ${
          totalMessages === 1 ? "message" : "messages"
        }`}
        action={
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-lg px-5 py-2.5 font-semibold h-auto"
          >
            <Plus className="h-4 w-4" />
            New Message
          </Button>
        }
      />

      {/* Messages List */}
      {messages.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <LifeBuoy className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            No support messages yet
          </h2>
          <p className="mb-6 text-gray-600">
            Send us a message and we&apos;ll get back to you.
          </p>
          <Button onClick={() => setIsCreateOpen(true)}>New Message</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <Table className="min-w-200 [&_td]:py-3 [&_th]:pb-3 [&_th]:pt-3">
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((msg) => {
                  const badge = SUPPORT_STATUS_BADGES[msg.contactStatus] ?? {
                    label: msg.contactStatus,
                    className: "rounded-full bg-gray-100 text-gray-600",
                  };
                  return (
                    <TableRow
                      key={msg.id}
                      onClick={() => setSelectedTicket(msg)}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <TableCell className="font-mono text-xs font-semibold text-gray-500 whitespace-nowrap">
                        {ticketNo(msg.id)}
                      </TableCell>
                      <TableCell className="max-w-96">
                        <p className="text-sm leading-relaxed text-gray-700 line-clamp-2">
                          {msg.message}
                        </p>
                        {msg.responseNotes && (
                          <span className="mt-1 inline-flex rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                            Replied
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {msg.orderReference ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[11px] text-gray-600">
                            <Package className="h-3 w-3" />
                            {msg.orderReference}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge className={badge.className}>
                          {badge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-gray-400 whitespace-nowrap">
                        {formatDateTime(msg.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {messagesData.totalPages > 1 && (
            <PaginationComponent
              currentPage={currentPage}
              totalPages={messagesData.totalPages}
              baseUrl="?page="
            />
          )}
        </div>
      )}

      <CreateTicketModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        user={user}
        orders={orders}
        onSubmitMessage={onSubmitMessage}
      />
      <TicketViewModal
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  );
};

export default MySupport;
