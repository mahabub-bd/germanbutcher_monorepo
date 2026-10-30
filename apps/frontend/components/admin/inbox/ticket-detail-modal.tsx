"use client";

import {
  ContactPriority,
  ContactSource,
  ContactStatus,
  ticketNo,
} from "@/components/admin/inbox/ticket-shared";
import { PillBadge, type PillTone } from "@/components/common/pill-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDateTime } from "@/lib/utils";
import { patchData, postData } from "@/utils/api-utils";
import type { ContactMessage } from "@/utils/types";
import {
  CalendarClock,
  CheckCheck,
  ChevronRight,
  Flag,
  Loader2,
  Mail,
  Phone,
  Send,
  User,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

interface TicketDetailModalProps {
  message: ContactMessage | null;
  canEdit: boolean;
  onClose: () => void;
  /** Called with the updated ticket so the list can be patched in place. */
  onUpdate: (updated: ContactMessage) => void;
  /** Full list refresh — fallback when an update doesn't return the ticket. */
  onRefreshList: () => void;
  onRefreshStats: () => void;
}

const STATUS_META: Record<ContactStatus, { label: string; tone: PillTone }> = {
  [ContactStatus.PENDING]: { label: "Open", tone: "amber" },
  [ContactStatus.IN_PROGRESS]: { label: "In progress", tone: "blue" },
  [ContactStatus.RESOLVED]: { label: "Resolved", tone: "emerald" },
  [ContactStatus.CLOSED]: { label: "Closed", tone: "neutral" },
};

const PRIORITY_META: Record<
  ContactPriority,
  { label: string; tone: PillTone }
> = {
  [ContactPriority.LOW]: { label: "Low", tone: "emerald" },
  [ContactPriority.MEDIUM]: { label: "Medium", tone: "amber" },
  [ContactPriority.HIGH]: { label: "High", tone: "red" },
};

const SOURCE_LABEL: Record<ContactSource, string> = {
  [ContactSource.WEBSITE]: "Website",
  [ContactSource.FACEBOOK]: "Facebook",
  [ContactSource.PHONE]: "Phone",
  [ContactSource.EMAIL]: "Email",
  [ContactSource.WHATSAPP]: "WhatsApp",
  [ContactSource.OTHER]: "Other",
};

interface TriageOption {
  value: string;
  label: string;
  tone: PillTone;
}

const STATUS_OPTIONS: TriageOption[] = Object.values(ContactStatus).map(
  (status) => ({ value: status, ...STATUS_META[status] })
);

const PRIORITY_OPTIONS: TriageOption[] = Object.values(ContactPriority).map(
  (priority) => ({ value: priority, ...PRIORITY_META[priority] })
);

const SOURCE_OPTIONS: TriageOption[] = Object.values(ContactSource).map(
  (source) => ({ value: source, label: SOURCE_LABEL[source], tone: "sky" })
);

const humanize = (value: string) => {
  const words = value.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const initialsOf = (name?: string | null) =>
  name?.trim().charAt(0).toUpperCase() || "?";

/** WhatsApp-style clock label, e.g. "4:12 PM" (Asia/Dhaka). */
const formatClock = (input: string | Date) =>
  new Date(input).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Dhaka",
  });

/** Chat date divider label, e.g. "30 Oct 2026" (Asia/Dhaka). */
const formatDay = (input: string | Date) =>
  new Date(input).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  });

export function TicketDetailModal({
  message: selectedMessage,
  canEdit,
  onClose,
  onUpdate,
  onRefreshList,
  onRefreshStats,
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

  const handleStatusChange = (status: string) =>
    patchTicket(
      { contactStatus: status },
      `Ticket marked as ${STATUS_META[status as ContactStatus]?.label.toLowerCase() ?? status}.`,
      (m) => ({ ...m, contactStatus: status as ContactMessage["contactStatus"] })
    );

  const handleSourceChange = (source: string) =>
    patchTicket(
      { source },
      `Source set to ${SOURCE_LABEL[source as ContactSource] ?? source}.`,
      (m) => ({ ...m, source: source as ContactMessage["source"] })
    );

  const handlePriorityChange = (priority: string) =>
    patchTicket(
      { priority },
      `Priority set to ${PRIORITY_META[priority as ContactPriority]?.label ?? priority}.`,
      (m) => ({ ...m, priority: priority as ContactMessage["priority"] })
    );

  // Sends the admin reply by email and stores it as the response note.
  const handleSendReply = async () => {
    if (!selectedMessage || !replyNotes.trim()) return;
    setIsUpdating(true);
    try {
      const result = await postData<ContactMessage>(
        `contact-messages/${selectedMessage.id}/reply`,
        { responseNotes: replyNotes.trim() }
      );
      const updated = result?.data;
      if (updated?.id) {
        onUpdate(updated);
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

  const status = STATUS_META[selectedMessage.contactStatus];
  const priority =
    PRIORITY_META[(selectedMessage.priority ?? "medium") as ContactPriority];

  // The API joins the handler relation, so `handledBy` is a user object (a plain
  // name string is still accepted). Fall back to "Handled by" — the avatar falls
  // back to an "S" initial for old tickets answered before handlers were recorded.
  const handlerName =
    typeof selectedMessage.handledBy === "string"
      ? selectedMessage.handledBy
      : selectedMessage.handledBy?.name?.trim() ||
      selectedMessage.handledBy?.email ||
      null;
  const handlerAvatar =
    typeof selectedMessage.handledBy === "object"
      ? selectedMessage.handledBy?.profilePhoto?.url ?? null
      : null;
  const customerAvatar = selectedMessage.user?.profilePhoto?.url ?? null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl">
        {/* Header — identity + state live here only. pr-12 keeps the actions
            clear of DialogContent's built-in close button. */}
        <header className="flex shrink-0 items-start gap-3 border-b px-6 py-4 pr-12">
          <TicketAvatar
            src={customerAvatar}
            name={selectedMessage.name}
            className="size-11 text-base font-semibold"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <DialogTitle className="truncate text-lg font-semibold sm:text-xl">
                {selectedMessage.name}
              </DialogTitle>
              <span className="rounded-md border bg-muted/60 px-2 py-0.5 font-mono text-[11px] font-medium tracking-tight text-muted-foreground tabular-nums">
                {ticketNo(selectedMessage.id)}
              </span>
              {status && (
                <PillBadge tone={status.tone} className="text-xs">
                  {status.label}
                </PillBadge>
              )}
              {priority && (
                <PillBadge tone={priority.tone} className="text-xs">
                  {priority.label} priority
                </PillBadge>
              )}
            </div>
            <DialogDescription className="mt-1 text-sm">
              Opened {formatDateTime(selectedMessage.createdAt)}
            </DialogDescription>
          </div>
        </header>

        {/* Mobile: one scrolling column. Desktop: conversation pane + fixed sidebar. */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_26rem] lg:overflow-hidden">
          <div className="flex min-h-0 flex-col lg:overflow-hidden">
            {/* WhatsApp-style thread: incoming on the left, replies on the right */}
            <div className="min-h-0 flex-1 overflow-y-auto bg-muted/30 px-4 py-4 lg:overflow-y-auto">
              <div className="mx-auto w-full  space-y-2">
                <div className="flex justify-center pb-1">
                  <span className="rounded-full border bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-xs">
                    {formatDay(selectedMessage.createdAt)}
                  </span>
                </div>

                {/* Incoming — customer */}
                <div className="flex items-end justify-start gap-2">
                  <TicketAvatar
                    src={customerAvatar}
                    name={selectedMessage.name}
                    className="size-8 text-sm font-semibold"
                  />
                  <div className="w-fit max-w-[78%] min-w-0 rounded-lg rounded-tl-none bg-card px-3 py-2 shadow-xs">
                    <p className="mb-0.5 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                      {selectedMessage.name}
                    </p>
                    <p className="text-[15px] leading-relaxed wrap-break-word whitespace-pre-wrap">
                      {selectedMessage.message}
                    </p>
                    <p className="mt-1 text-right text-[11px] text-muted-foreground">
                      {formatClock(selectedMessage.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Outgoing — support reply */}
                {selectedMessage.responseNotes && (
                  <div className="flex items-end justify-end gap-2">
                    <div className="w-fit max-w-[78%] min-w-0 rounded-lg rounded-tr-none bg-emerald-100 px-3 py-2 shadow-xs dark:bg-emerald-500/15">
                      <p className="mb-0.5 text-right text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                        {handlerName ? `${handlerName} · Support` : "Support"}
                      </p>
                      <p className="text-[15px] leading-relaxed wrap-break-word whitespace-pre-wrap">
                        {selectedMessage.responseNotes}
                      </p>
                      <p className="mt-1 flex items-center justify-end gap-1 text-[11px] text-emerald-800/70 dark:text-emerald-300/70">
                        {formatClock(selectedMessage.updatedAt)}
                        <CheckCheck className="size-3.5" />
                      </p>
                    </div>
                    <TicketAvatar
                      src={handlerAvatar}
                      name={handlerName ?? "Support"}
                      className="size-8 text-sm font-semibold"
                    />
                  </div>
                )}

                {!canEdit && !selectedMessage.responseNotes && (
                  <div className="flex justify-start">
                    <p className="w-fit max-w-[78%] rounded-lg rounded-tl-none border border-dashed bg-card/60 px-3 py-2 text-sm text-muted-foreground">
                      No reply has been sent for this ticket yet.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Composer — WhatsApp-style input with a round send button */}
            {canEdit && (
              <div className="border-t bg-muted/30 px-4 py-3 lg:shrink-0">
                <div className="flex items-end gap-2">
                  <div className="flex-1 overflow-hidden rounded-2xl border bg-card shadow-xs transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20">
                    <Textarea
                      value={replyNotes}
                      onChange={(e) => setReplyNotes(e.target.value)}
                      disabled={isUpdating}
                      rows={2}
                      placeholder="Type a reply…"
                      className="min-h-11 resize-none border-0 bg-transparent px-4 py-2.5 text-[15px] shadow-none focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
                    />
                  </div>
                  <Button
                    size="icon"
                    aria-label="Send reply"
                    title="Send reply"
                    className="size-11 shrink-0 rounded-full bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                    onClick={handleSendReply}
                    disabled={isUpdating || !replyNotes.trim()}
                  >
                    {isUpdating ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <Send className="size-5" />
                    )}
                  </Button>
                </div>
                <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                  <Mail className="size-3" />
                  Reply is emailed to {selectedMessage.email} and saved on the
                  ticket
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 border-t bg-muted/20 p-4 lg:min-h-0 lg:overflow-y-auto lg:border-t-0 lg:border-l">
            <section className="overflow-hidden rounded-xl border bg-card">
              <SectionHeader icon={User} title="Requester" />
              <div className="p-3">
                <div className="flex items-center gap-2">
                  <TicketAvatar
                    src={customerAvatar}
                    name={selectedMessage.name}
                    className="size-8 text-xs font-semibold"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold leading-tight">
                      {selectedMessage.name}
                    </p>
                    <PillBadge
                      tone={selectedMessage.userId ? "violet" : "neutral"}
                      className="mt-0.5 text-[10px]"
                    >
                      {selectedMessage.userId
                        ? "Registered customer"
                        : "Guest visitor"}
                    </PillBadge>
                  </div>
                </div>

                <div className="mt-2 space-y-0.5 text-[13px]">
                  <a
                    href={`mailto:${selectedMessage.email}`}
                    className="flex items-center gap-2 rounded-md px-1 py-0.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                  >
                    <Mail className="size-3.5 shrink-0" />
                    <span className="truncate">{selectedMessage.email}</span>
                  </a>
                  {selectedMessage.mobile && (
                    <a
                      href={`tel:${selectedMessage.mobile}`}
                      className="flex items-center gap-2 rounded-md px-1 py-0.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                    >
                      <Phone className="size-3.5 shrink-0" />
                      <span className="truncate">
                        {selectedMessage.mobile}
                      </span>
                    </a>
                  )}
                </div>

                {selectedMessage.userId && (
                  <Link
                    href={`/admin/crm/customers/${selectedMessage.userId}`}
                    className="mt-2 flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-[13px] font-medium transition-colors hover:bg-muted/50"
                  >
                    View customer profile
                    <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                  </Link>
                )}
              </div>
            </section>

            {canEdit && (
              <section className="overflow-hidden rounded-xl border bg-card">
                <SectionHeader
                  icon={Flag}
                  title="Triage"
                  hint={isUpdating ? "Saving…" : undefined}
                />
                <div className="space-y-4 p-4">
                  <TriageGroup
                    label="Status"
                    options={STATUS_OPTIONS}
                    value={selectedMessage.contactStatus}
                    disabled={isUpdating}
                    onChange={handleStatusChange}
                  />
                  <TriageGroup
                    label="Priority"
                    options={PRIORITY_OPTIONS}
                    value={selectedMessage.priority ?? ContactPriority.MEDIUM}
                    disabled={isUpdating}
                    onChange={handlePriorityChange}
                  />
                  <TriageGroup
                    label="Source"
                    options={SOURCE_OPTIONS}
                    value={selectedMessage.source ?? ContactSource.WEBSITE}
                    disabled={isUpdating}
                    onChange={handleSourceChange}
                  />
                </div>
              </section>
            )}

            <section className="overflow-hidden rounded-xl border bg-card">
              <SectionHeader icon={CalendarClock} title="Ticket details" />
              <dl className="space-y-2.5 p-4 text-sm">
                {/* Source is only read-only here — editors change it in Triage. */}
                {!canEdit && (
                  <DetailRow
                    label="Source"
                    value={
                      selectedMessage.source
                        ? SOURCE_LABEL[selectedMessage.source as ContactSource]
                        : "—"
                    }
                  />
                )}
                <DetailRow
                  label="Created"
                  value={formatDateTime(selectedMessage.createdAt)}
                />
                <DetailRow
                  label="Last updated"
                  value={formatDateTime(selectedMessage.updatedAt)}
                />
                {handlerName && (
                  <DetailRow label="Handled by" value={handlerName} />
                )}
                {selectedMessage.orderReference && (
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-muted-foreground">Order reference</dt>
                    <dd className="text-right font-medium">
                      <Link
                        href={`/admin/orders?search=${encodeURIComponent(selectedMessage.orderReference)}`}
                        className="font-mono text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {selectedMessage.orderReference}
                        <ChevronRight className="inline size-3" />
                      </Link>
                    </dd>
                  </div>
                )}
                {selectedMessage.actionTaken && (
                  <DetailRow
                    label="Action taken"
                    value={humanize(selectedMessage.actionTaken)}
                  />
                )}
              </dl>
            </section>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Card heading: uppercase label on the left, an optional muted hint on the right. */
function SectionHeader({
  icon: Icon,
  title,
  hint,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2.5">
      <h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <Icon className="size-4" />
        {title}
      </h3>
      {hint && (
        <span className="text-xs text-muted-foreground">{hint}</span>
      )}
    </div>
  );
}

/** Round avatar: profile photo when available, an uppercase initial otherwise. */
function TicketAvatar({
  src,
  name,
  className,
}: {
  src?: string | null;
  name: string;
  className?: string;
}) {
  if (src) {
    return (
      <span
        className={cn(
          "relative block shrink-0 overflow-hidden rounded-full border bg-muted",
          className
        )}
      >
        <Image
          src={src}
          alt={`${name}'s avatar`}
          fill
          className="object-contain"
        />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border bg-muted uppercase text-muted-foreground",
        className
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

/**
 * Pill toggle row. The active option carries its semantic tone; the rest stay
 * neutral so the current value is the only coloured chip in the group.
 */
function TriageGroup({
  label,
  options,
  value,
  disabled,
  onChange,
}: {
  label: string;
  options: TriageOption[];
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded-full outline-hidden transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                !active && "opacity-60 hover:opacity-100"
              )}
            >
              <PillBadge
                tone={active ? option.tone : "neutral"}
                className="text-xs"
              >
                {option.label}
              </PillBadge>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Label/value row — plain text values, no decorative icons. */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
