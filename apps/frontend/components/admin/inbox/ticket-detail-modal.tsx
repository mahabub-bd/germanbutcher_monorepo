"use client";

import { Button } from "@/components/ui/button";
import {
  ContactPriority,
  ContactSource,
  ContactStatus,
  formatDate,
  getPriorityBadge,
  getStatusBadge,
  SOURCE_ICONS,
  ticketNo,
  timeAgo,
} from "@/components/admin/inbox/ticket-shared";
import { patchData, postData } from "@/utils/api-utils";
import type { ContactMessage } from "@/utils/types";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Flag,
  Info,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Send,
  Share2,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

interface TicketDetailModalProps {
  message: ContactMessage | null;
  canEdit: boolean;
  canDelete: boolean;
  onClose: () => void;
  /** Called with the updated ticket so the list can be patched in place. */
  onUpdate: (updated: ContactMessage) => void;
  /** Full list refresh — fallback when an update doesn't return the ticket. */
  onRefreshList: () => void;
  onRefreshStats: () => void;
  onDeleteClick: (message: ContactMessage) => void;
}

export function TicketDetailModal({
  message: selectedMessage,
  canEdit,
  canDelete,
  onClose,
  onUpdate,
  onRefreshList,
  onRefreshStats,
  onDeleteClick,
}: TicketDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [replyNotes, setReplyNotes] = useState("");

  if (!selectedMessage) return null;

  const patchTicket = async (
    body: Record<string, unknown>,
    successMessage: string,
    applyLocal: (m: ContactMessage) => ContactMessage
  ) => {
    setIsUpdating(true);
    try {
      await patchData(`contact-messages/${selectedMessage.id}`, body);
      onUpdate(applyLocal(selectedMessage));
      onRefreshStats();
      toast.success(successMessage);
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast.error("Failed to update ticket.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = (status: ContactStatus) =>
    patchTicket(
      { contactStatus: status },
      `Ticket marked as ${status.replace("_", " ")}.`,
      (m) => ({ ...m, contactStatus: status })
    );

  const handleSourceChange = (source: ContactSource) =>
    patchTicket({ source }, `Source set to ${source}.`, (m) => ({ ...m, source }));

  const handlePriorityChange = (priority: ContactPriority) =>
    patchTicket(
      { priority },
      `Priority set to ${priority}.`,
      (m) => ({ ...m, priority })
    );

  // Sends the admin reply by email and stores it as the response note.
  const handleSendReply = async () => {
    if (!selectedMessage || !replyNotes.trim()) return;
    setIsUpdating(true);
    try {
      const result = await postData<{ data: ContactMessage }>(
        `contact-messages/${selectedMessage.id}/reply`,
        { responseNotes: replyNotes.trim() }
      );
      const updated = (result as any)?.data ?? result;
      if (updated?.id) {
        onUpdate(updated as ContactMessage);
      } else {
        onRefreshList();
      }
      onRefreshStats();
      toast.success("Reply sent successfully");
      setReplyNotes("");
    } catch (error) {
      console.error("Error sending contact response:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-4">
      <div className="bg-white dark:bg-neutral-900 w-full h-full sm:h-auto sm:rounded-2xl max-w-7xl max-h-full sm:max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b px-4 py-3 flex items-center justify-between gap-2 z-10 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Back"
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <MessageSquare className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                  {ticketNo(selectedMessage.id)}
                </h3>
                {getPriorityBadge(selectedMessage.priority)}
              </div>
              <p className="text-xs text-gray-400 truncate">
                Created on {formatDate(selectedMessage.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/40"
                onClick={() => {
                  onClose();
                  onDeleteClick(selectedMessage);
                }}
              >
                <Trash2 className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close"
            >
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-4 sm:p-6 grid lg:grid-cols-3 gap-5">
          {/* LEFT — main ticket area */}
          <div className="lg:col-span-2 space-y-5">
            {/* Customer card */}
            <div className="rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50/60 dark:bg-neutral-800/50 p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-base font-bold text-blue-700 dark:text-blue-300">
                  {selectedMessage.name?.charAt(0).toUpperCase() || "?"}
                </span>
                <div className="min-w-0">
                  <p className="text-base font-bold text-gray-900 dark:text-white truncate">
                    {selectedMessage.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                    <a
                      href={`mailto:${selectedMessage.email}`}
                      className="flex items-center gap-1 hover:text-blue-600"
                    >
                      <Mail className="h-3 w-3" />
                      {selectedMessage.email}
                    </a>
                    {selectedMessage.mobile && (
                      <>
                        <span className="text-gray-300">|</span>
                        <a
                          href={`tel:${selectedMessage.mobile}`}
                          className="flex items-center gap-1 hover:text-blue-600"
                        >
                          <Phone className="h-3 w-3" />
                          {selectedMessage.mobile}
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-[10px] text-gray-400">Request Time</p>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {formatDate(selectedMessage.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Status / Source / Priority controls */}
            <div className="rounded-xl border border-gray-200 dark:border-neutral-700 p-4 space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 w-20 shrink-0">
                  <FileText className="h-4 w-4 text-gray-400" /> Status
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {Object.values(ContactStatus).map((status) => {
                    const active = selectedMessage.contactStatus === status;
                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        disabled={isUpdating || !canEdit}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors disabled:opacity-50 ${active
                          ? "bg-blue-50 border-blue-400 text-blue-600 dark:bg-blue-950/40 font-medium"
                          : "border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:border-blue-300"
                          }`}
                      >
                        {active && (
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        )}
                        {status === ContactStatus.PENDING
                          ? "Open"
                          : status === ContactStatus.IN_PROGRESS
                            ? "In progress"
                            : status}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 w-20 shrink-0">
                  <Share2 className="h-4 w-4 text-gray-400" /> Source
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {Object.values(ContactSource).map((source) => {
                    const active = selectedMessage.source === source;
                    const Icon = SOURCE_ICONS[source];
                    return (
                      <button
                        key={source}
                        onClick={() => handleSourceChange(source)}
                        disabled={isUpdating || !canEdit}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm capitalize transition-colors disabled:opacity-50 ${active
                          ? "bg-teal-50 border-teal-400 text-teal-700 dark:bg-teal-950/40 font-medium"
                          : "border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:border-teal-300"
                          }`}
                      >
                        {active && (
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        )}
                        <Icon className="h-3.5 w-3.5" />
                        {source}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 w-20 shrink-0">
                  <Flag className="h-4 w-4 text-gray-400" /> Priority
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {Object.values(ContactPriority).map((priority) => {
                    const active =
                      (selectedMessage.priority ?? "medium") === priority;
                    return (
                      <button
                        key={priority}
                        onClick={() => handlePriorityChange(priority)}
                        disabled={isUpdating || !canEdit}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm capitalize transition-colors disabled:opacity-50 ${active
                          ? "bg-amber-50 border-amber-400 text-amber-700 dark:bg-amber-950/40 font-medium"
                          : "border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:border-amber-300"
                          }`}
                      >
                        {active && (
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        )}
                        {priority}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Conversation */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Conversation
              </h4>

              {/* Customer message */}
              <div className="flex items-start gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-neutral-700 text-xs font-bold text-gray-600 dark:text-gray-300">
                  {selectedMessage.name?.charAt(0).toUpperCase() || "?"}
                </span>
                <div className="flex-1 min-w-0 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 px-4 py-3">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">
                    {selectedMessage.name}
                    <span className="ml-2 font-normal text-gray-400">
                      {timeAgo(selectedMessage.createdAt)}
                    </span>
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mt-1">
                    {selectedMessage.message}
                  </p>
                </div>
              </div>

              {/* Admin reply (latest response) */}
              {selectedMessage.responseNotes && (
                <div className="flex items-start gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-xs font-bold text-blue-700 dark:text-blue-300">
                    MH
                  </span>
                  <div className="flex-1 min-w-0 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 px-4 py-3">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                      Support
                      {selectedMessage.handledBy
                        ? ` (${selectedMessage.handledBy})`
                        : ""}
                      <span className="ml-2 font-normal text-gray-400">
                        {timeAgo(selectedMessage.updatedAt)}
                      </span>
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mt-1">
                      {selectedMessage.responseNotes}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Reply box */}
            {canEdit && (
              <div className="rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
                <div className="px-4 pt-3 flex items-center gap-4 border-b border-gray-100 dark:border-neutral-800">
                  <span className="text-sm font-semibold text-blue-600 border-b-2 border-blue-600 pb-2">
                    Reply
                  </span>
                </div>
                <div className="p-3">
                  <textarea
                    value={replyNotes}
                    onChange={(e) => setReplyNotes(e.target.value)}
                    disabled={isUpdating}
                    rows={3}
                    placeholder="Type your reply — it will be emailed to the customer..."
                    className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y disabled:opacity-50"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-gray-400">
                      Emails the customer and saves the response.
                    </span>
                    <Button
                      size="sm"
                      onClick={handleSendReply}
                      disabled={isUpdating || !replyNotes.trim()}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Send Reply
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — sidebar */}
          <div className="space-y-5">
            {/* Ticket Information */}
            <div className="rounded-xl border border-gray-200 dark:border-neutral-700 p-4">
              <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white mb-3">
                <Info className="h-4 w-4 text-blue-500" /> Ticket Information
              </h4>
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <MessageSquare className="h-3.5 w-3.5" /> Ticket ID
                  </dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {ticketNo(selectedMessage.id)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-gray-500 dark:text-gray-400">Status</dt>
                  <dd>{getStatusBadge(selectedMessage.contactStatus)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Flag className="h-3.5 w-3.5" /> Priority
                  </dt>
                  <dd>{getPriorityBadge(selectedMessage.priority)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Share2 className="h-3.5 w-3.5" /> Source
                  </dt>
                  <dd>
                    <span className="text-sm capitalize text-gray-900 dark:text-white">
                      {selectedMessage.source ?? "—"}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Calendar className="h-3.5 w-3.5" /> Created At
                  </dt>
                  <dd className="text-xs text-gray-700 dark:text-gray-300">
                    {formatDate(selectedMessage.createdAt)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <RefreshCw className="h-3.5 w-3.5" /> Updated At
                  </dt>
                  <dd className="text-xs text-gray-700 dark:text-gray-300">
                    {formatDate(selectedMessage.updatedAt)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Customer */}
            <div className="rounded-xl border border-gray-200 dark:border-neutral-700 p-4">
              <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white mb-3">
                <User className="h-4 w-4 text-blue-500" /> Customer
              </h4>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-sm font-bold text-blue-700 dark:text-blue-300">
                  {selectedMessage.name?.charAt(0).toUpperCase() || "?"}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {selectedMessage.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {selectedMessage.email}
                  </p>
                  {selectedMessage.mobile && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedMessage.mobile}
                    </p>
                  )}
                </div>
              </div>
              {selectedMessage.userId && (
                <Link
                  href={`/admin/crm/customers/${selectedMessage.userId}`}
                  className="mt-3 flex items-center justify-between rounded-lg border border-gray-200 dark:border-neutral-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800"
                >
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    View Customer Profile
                  </span>
                  <span className="text-gray-400">›</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
