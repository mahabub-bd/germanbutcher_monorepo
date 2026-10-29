"use client";

import { SegmentBadge } from "@/components/admin/crm/segment-badge";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/utils";
import {
  deleteData,
  fetchDataPagination,
  fetchProtectedData,
  postData,
} from "@/utils/api-utils";
import {
  Eye,
  Loader2,
  Mail,
  Megaphone,
  MessageSquareText,
  Plus,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

type CampaignChannel = "sms" | "email";
type CampaignStatus = "draft" | "sending" | "sent" | "failed";

interface Campaign {
  id: number;
  name: string;
  channel: CampaignChannel;
  segment: string | null;
  subject: string | null;
  message: string;
  status: CampaignStatus;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  sentAt: string | null;
  createdAt: string;
  createdBy?: { id: number; name: string } | null;
}

interface CampaignRecipient {
  id: number;
  userId: number | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  status: "pending" | "sent" | "failed" | "skipped";
  error: string | null;
  sentAt: string | null;
}

interface ListResponse {
  data: Campaign[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const SEGMENT_OPTIONS = [
  { value: "all", label: "All customers" },
  { value: "champions", label: "Champions" },
  { value: "vip", label: "VIP" },
  { value: "loyal", label: "Loyal" },
  { value: "promising", label: "Promising" },
  { value: "new", label: "New" },
  { value: "about_to_sleep", label: "About to Sleep" },
  { value: "at_risk", label: "At Risk" },
  { value: "lost", label: "Lost" },
  { value: "inactive", label: "Inactive" },
];

const STATUS_STYLES: Record<CampaignStatus, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  sending: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  sent: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const EMPTY_FORM = {
  name: "",
  channel: "sms" as CampaignChannel,
  segment: "all",
  subject: "",
  message: "",
};

export function CrmCampaignList() {
  const { can } = usePermissions();
  const MENU_URL = "/admin/crm";

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Create dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Send confirmation
  const [sendTarget, setSendTarget] = useState<Campaign | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Detail dialog
  const [detail, setDetail] = useState<{
    campaign: Campaign;
    recipients: CampaignRecipient[];
    recipientTotal: number;
  } | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      // fetchDataPagination keeps the envelope (data/total/totalPages);
      // fetchProtectedData would unwrap it and hand back the bare array.
      const res = await fetchDataPagination<ListResponse>(
        `crm/campaigns?page=${page}&limit=10`
      );
      setCampaigns(res.data);
      setTotalPages(res.totalPages ?? 1);
      setTotalItems(res.total ?? 0);
    } catch {
      toast.error("Failed to load campaigns.");
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Live recipient count while composing (debounced).
  useEffect(() => {
    if (!isCreateOpen) return;
    let cancelled = false;
    setIsLoadingPreview(true);
    const timer = setTimeout(async () => {
      try {
        const segment =
          form.segment === "all" ? "" : `?segment=${form.segment}`;
        const res = await fetchProtectedData<{ count: number }>(
          `crm/campaigns/recipients-preview${segment}`
        );
        if (!cancelled) setPreviewCount(res.count);
      } catch {
        if (!cancelled) setPreviewCount(null);
      } finally {
        if (!cancelled) setIsLoadingPreview(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.segment, isCreateOpen]);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.message.trim()) {
      toast.error("Name and message are required.");
      return;
    }
    if (form.channel === "email" && !form.subject.trim()) {
      toast.error("Email campaigns need a subject.");
      return;
    }
    setIsSubmitting(true);
    try {
      await postData("crm/campaigns", {
        name: form.name.trim(),
        channel: form.channel,
        segment: form.segment === "all" ? null : form.segment,
        subject: form.channel === "email" ? form.subject.trim() : null,
        message: form.message,
      });
      toast.success("Campaign created as draft.");
      setIsCreateOpen(false);
      setForm(EMPTY_FORM);
      setPreviewCount(null);
      setPage(1);
      fetchCampaigns();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create campaign."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSend = async () => {
    if (!sendTarget) return;
    setIsSending(true);
    try {
      const res = await postData<{ totalRecipients: number }>(
        `crm/campaigns/${sendTarget.id}/send`
      );
      toast.success(
        `Queued for ${res.data?.totalRecipients ?? sendTarget.totalRecipients} customers — delivery runs in the background.`
      );
      setSendTarget(null);
      fetchCampaigns();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send campaign."
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenDetail = async (campaign: Campaign) => {
    setIsLoadingDetail(true);
    try {
      const res = await fetchProtectedData<{
        campaign: Campaign;
        recipients: CampaignRecipient[];
        recipientTotal: number;
      }>(`crm/campaigns/${campaign.id}`);
      setDetail(res);
    } catch {
      toast.error("Failed to load campaign detail.");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleDelete = async (campaign: Campaign) => {
    setIsDeleting(campaign.id);
    try {
      await deleteData(`crm/campaigns/${campaign.id}`);
      toast.success("Campaign deleted.");
      fetchCampaigns();
    } catch {
      toast.error("Failed to delete campaign.");
    } finally {
      setIsDeleting(null);
    }
  };

  const channelIcon = (channel: CampaignChannel) =>
    channel === "sms" ? (
      <MessageSquareText className="h-4 w-4" />
    ) : (
      <Mail className="h-4 w-4" />
    );

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="CRM Campaigns"
        description="Send SMS and email blasts to a customer segment. Recipients are snapshotted at send time with a per-customer delivery log."
      >
        <Button
          size="sm"
          disabled={!can(MENU_URL, "canCreate")}
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">New Campaign</span>
        </Button>
      </PageHeader>

      <p className="text-sm text-muted-foreground">
        {totalItems} campaign{totalItems === 1 ? "" : "s"}
      </p>

      {isLoading ? (
        <LoadingIndicator message="Loading campaigns..." />
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-10 text-center">
          <Megaphone className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No campaigns yet</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Create one to reach a customer segment by SMS or email.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-180 [&_td]:py-4 [&_th]:pb-3 [&_th]:pt-0">
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Delivered</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id} className="hover:bg-muted/50">
                  <TableCell>
                    <button
                      className="text-left font-medium hover:underline"
                      onClick={() => handleOpenDetail(campaign)}
                    >
                      {campaign.name}
                    </button>
                    <span className="block text-xs text-muted-foreground">
                      {campaign.sentAt
                        ? `Sent ${formatDateTime(campaign.sentAt)}`
                        : formatDateTime(campaign.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize gap-1">
                      {channelIcon(campaign.channel)}
                      {campaign.channel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {campaign.segment ? (
                      <SegmentBadge segment={campaign.segment} />
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        All customers
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLES[campaign.status]}`}
                    >
                      {campaign.status === "sending" && (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      )}
                      {campaign.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {campaign.totalRecipients > 0
                      ? `${campaign.sentCount} / ${campaign.totalRecipients}`
                      : "—"}
                    {campaign.failedCount > 0 && (
                      <span className="block text-xs text-destructive">
                        {campaign.failedCount} failed
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {campaign.createdBy?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {campaign.status === "draft" &&
                        can(MENU_URL, "canEdit") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSendTarget(campaign)}
                            aria-label="Send campaign"
                          >
                            <Send className="h-4 w-4 text-primaryColor" />
                          </Button>
                        )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDetail(campaign)}
                        aria-label="View campaign"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {can(MENU_URL, "canDelete") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isDeleting === campaign.id}
                          onClick={() => handleDelete(campaign)}
                          aria-label="Delete campaign"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create campaign */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Campaign</DialogTitle>
            <DialogDescription>
              Compose a message, pick a segment, then send it as a draft.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="campaign-name">Name</Label>
              <Input
                id="campaign-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Eid win-back offer"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 *:w-full">
              <div className="space-y-1 min-w-0">
                <Label>Channel</Label>
                <Select
                  value={form.channel}
                  onValueChange={(value) =>
                    setForm({ ...form, channel: value as CampaignChannel })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 min-w-0">
                <Label>Segment</Label>
                <Select
                  value={form.segment}
                  onValueChange={(value) =>
                    setForm({ ...form, segment: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEGMENT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
              {isLoadingPreview ? (
                <span className="text-muted-foreground">Counting…</span>
              ) : previewCount !== null ? (
                <span>
                  Will reach{" "}
                  <span className="font-semibold">{previewCount}</span>{" "}
                  customer{previewCount === 1 ? "" : "s"}
                  {form.channel === "sms" && " (those without a number are skipped)"}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Recipient count unavailable
                </span>
              )}
            </div>
            {form.channel === "email" && (
              <div className="space-y-1">
                <Label htmlFor="campaign-subject">Subject</Label>
                <Input
                  id="campaign-subject"
                  value={form.subject}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value })
                  }
                  placeholder="A special offer for you"
                />
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="campaign-message">Message</Label>
              <Textarea
                id="campaign-message"
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder={
                  form.channel === "sms"
                    ? "Hello {{name}}, we miss you! Here is 10% off your next order…"
                    : "Hello {{name}},\n\nWe have something special for you…"
                }
              />
              <p className="text-xs text-muted-foreground">
                Use {"{{name}}"} to insert the customer&apos;s first name.
                {form.channel === "sms" &&
                  " SMS is billed per 160-character segment — keep it short."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send confirmation */}
      <Dialog
        open={sendTarget !== null}
        onOpenChange={(open) => !open && setSendTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send campaign?</DialogTitle>
            <DialogDescription>
              &ldquo;{sendTarget?.name}&rdquo; will be delivered to{" "}
              {sendTarget?.totalRecipients === 0
                ? "the segment's customers"
                : sendTarget?.totalRecipients}{" "}
              {sendTarget?.channel === "sms" ? "by SMS" : "by email"}. This
              costs real money and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={isSending}>
              {isSending ? "Queueing..." : "Send now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail with recipient log */}
      <Dialog
        open={detail !== null}
        onOpenChange={(open) => !open && setDetail(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {channelIcon(detail.campaign.channel)}
                  {detail.campaign.name}
                </DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLES[detail.campaign.status]}`}
                  >
                    {detail.campaign.status}
                  </span>
                  <span>
                    {detail.campaign.sentCount} sent ·{" "}
                    {detail.campaign.failedCount} failed ·{" "}
                    {detail.campaign.totalRecipients} total
                  </span>
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                {detail.campaign.subject && (
                  <p className="font-semibold mb-1">
                    Subject: {detail.campaign.subject}
                  </p>
                )}
                {detail.campaign.message}
              </div>
              <div className="border rounded-md">
                <Table className="min-w-80">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>
                        {detail.campaign.channel === "sms" ? "Phone" : "Email"}
                      </TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.recipients.map((recipient) => (
                      <TableRow key={recipient.id}>
                        <TableCell className="text-sm">
                          {recipient.name ?? `#${recipient.userId ?? "?"}`}
                          {recipient.error && (
                            <span className="block text-xs text-destructive">
                              {recipient.error}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {detail.campaign.channel === "sms"
                            ? (recipient.phone ?? "—")
                            : (recipient.email ?? "—")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="capitalize text-xs"
                          >
                            {recipient.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {detail.recipientTotal > detail.recipients.length && (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center text-xs text-muted-foreground"
                        >
                          Showing first {detail.recipients.length} of{" "}
                          {detail.recipientTotal} recipients
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {isLoadingDetail && (
        <LoadingIndicator message="Loading campaign..." />
      )}
    </div>
  );
}
