"use client";

import type React from "react";

import { PaginationComponent } from "@/components/common/pagination";
import StatsCard from "@/components/admin/dashboard/stats-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteData, fetchDataPagination, fetchProtectedData, postData } from "@/utils/api-utils";
import type { ContactMessage } from "@/utils/types";
import { ActionTaken } from "@/utils/types";
import {
  AlertCircle,
  Ban,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Filter,
  Info,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Package,
  Phone,
  PhoneCall,
  Quote,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShoppingCart,
  Tag,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

export enum ContactStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
  CLOSED = "closed",
}

// Status Update Modal Component (defined outside to prevent re-renders)
interface StatusUpdateModalProps {
  isOpen: boolean;
  message: ContactMessage | null;
  selectedAction: ActionTaken | "";
  selectedStatus: ContactStatus;
  responseNotes: string;
  isUpdating: boolean;
  onClose: () => void;
  onUpdateStatus: (status: ContactStatus) => void;
  onSendMessage: () => void;
  onActionChange: (action: ActionTaken | "") => void;
  onNotesChange: (notes: string) => void;
  responseNotesRef: React.RefObject<HTMLTextAreaElement | null>;
  formatDate: (date: string) => string;
}

const statusOptions: Array<{
  value: ContactStatus;
  label: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
}> = [
  {
    value: ContactStatus.PENDING,
    label: "Pending",
    description: "Waiting for response",
    icon: <Clock className="h-4.5 w-4.5" />,
    iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    value: ContactStatus.IN_PROGRESS,
    label: "In Progress",
    description: "Currently working on it",
    icon: <AlertCircle className="h-4.5 w-4.5" />,
    iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    value: ContactStatus.RESOLVED,
    label: "Resolved",
    description: "Issue has been resolved",
    icon: <CheckCircle className="h-4.5 w-4.5" />,
    iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  {
    value: ContactStatus.CLOSED,
    label: "Closed",
    description: "Conversation is closed",
    icon: <XCircle className="h-4.5 w-4.5" />,
    iconBg: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  },
];

const actionOptions: Array<{
  value: ActionTaken | "";
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  { value: "", label: "None", description: "No action", icon: <Ban className="h-4.5 w-4.5" /> },
  { value: ActionTaken.REPLIED_VIA_EMAIL, label: "Email", description: "Send an email", icon: <Send className="h-4.5 w-4.5" /> },
  { value: ActionTaken.CALLED_CUSTOMER, label: "Called", description: "Made a call", icon: <PhoneCall className="h-4.5 w-4.5" /> },
  { value: ActionTaken.PROVIDED_PRODUCT_INFO, label: "Info", description: "Provide information", icon: <Package className="h-4.5 w-4.5" /> },
  { value: ActionTaken.ISSUE_RESOLVED, label: "Resolved", description: "Mark as resolved", icon: <CheckCircle className="h-4.5 w-4.5" /> },
  { value: ActionTaken.ORDER_PLACED, label: "Order", description: "Create an order", icon: <ShoppingCart className="h-4.5 w-4.5" /> },
  { value: ActionTaken.REFUND_PROCESSED, label: "Refund", description: "Process a refund", icon: <RefreshCw className="h-4.5 w-4.5" /> },
  { value: ActionTaken.OTHER, label: "Other", description: "Other action", icon: <FileText className="h-4.5 w-4.5" /> },
];

// Radio dot indicator used inside selectable option cards
function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        selected
          ? "border-blue-600 dark:border-blue-500"
          : "border-gray-300 dark:border-neutral-600"
      }`}
    >
      {selected && <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-500" />}
    </span>
  );
}

// Section header with tinted icon chip, e.g. "New Status" / "Action" / "Response Notes"
function SectionHeading({
  icon,
  title,
  subtitle,
  trailing,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          {icon}
        </span>
        <div>
          <h4 className="text-base font-bold text-gray-900 dark:text-white">{title}</h4>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
      </div>
      {trailing}
    </div>
  );
}

function StatusUpdateModal({
  isOpen,
  message,
  selectedAction,
  selectedStatus,
  responseNotes,
  isUpdating,
  onClose,
  onUpdateStatus,
  onSendMessage,
  onActionChange,
  onNotesChange,
  responseNotesRef,
  formatDate,
}: StatusUpdateModalProps) {
  if (!isOpen || !message) return null;

  const cardClasses = (selected: boolean) =>
    `flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
      selected
        ? "border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20"
        : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 dark:border-neutral-700 dark:bg-neutral-800/50 dark:hover:border-blue-600 dark:hover:bg-blue-900/10"
    }`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <MessageSquare className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Update Status</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{message.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUpdating}
            aria-label="Close"
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Customer Info */}
          <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-900/10 p-4">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-white">{message.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">{message.name}</h4>
                  <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(message.createdAt)}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                  <a
                    href={`mailto:${message.email}`}
                    className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{message.email}</span>
                  </a>
                  {message.mobile && (
                    <>
                      <span className="hidden sm:block h-4 w-px bg-gray-300 dark:bg-neutral-600" />
                      <a
                        href={`tel:${message.mobile}`}
                        className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>{message.mobile}</span>
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
            {/* Message preview */}
            <div className="mt-3 flex gap-3 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-3">
              <Quote className="h-5 w-5 shrink-0 fill-gray-300 text-gray-300 dark:fill-neutral-600 dark:text-neutral-600" />
              <p className="text-sm text-gray-700 dark:text-gray-300 italic whitespace-pre-wrap">
                {message.message}
              </p>
            </div>
          </div>

          {/* Current Status */}
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="text-xs text-amber-700 dark:text-amber-300">Current Status</p>
              <p className="text-base font-bold text-amber-600 dark:text-amber-400 capitalize">
                {message.contactStatus.replace("_", " ")}
              </p>
            </div>
          </div>

          {/* Status & Action Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* New Status */}
            <div className="rounded-xl border border-gray-200 dark:border-neutral-700 p-4 space-y-3">
              <SectionHeading
                icon={<Tag className="h-4.5 w-4.5" />}
                title="New Status"
                subtitle="Select a new status for this conversation"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {statusOptions.map((status) => {
                  const selected = selectedStatus === status.value;
                  return (
                    <button
                      key={status.value}
                      onClick={() => onUpdateStatus(status.value)}
                      disabled={isUpdating}
                      aria-pressed={selected}
                      className={cardClasses(selected)}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${status.iconBg}`}>
                        {status.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-gray-900 dark:text-white">{status.label}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{status.description}</span>
                      </span>
                      <RadioDot selected={selected} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action */}
            <div className="rounded-xl border border-gray-200 dark:border-neutral-700 p-4 space-y-3">
              <SectionHeading
                icon={<Settings className="h-4.5 w-4.5" />}
                title="Action"
                subtitle="Choose an action to take"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {actionOptions.map((action) => {
                  const selected = selectedAction === action.value;
                  return (
                    <button
                      key={action.label}
                      onClick={() => onActionChange(action.value)}
                      disabled={isUpdating}
                      aria-pressed={selected}
                      className={cardClasses(selected)}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-neutral-700 dark:text-gray-300">
                        {action.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-gray-900 dark:text-white">{action.label}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{action.description}</span>
                      </span>
                      <RadioDot selected={selected} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Response Notes */}
          <div className="rounded-xl border border-gray-200 dark:border-neutral-700 p-4 space-y-3">
            <SectionHeading
              icon={<FileText className="h-4.5 w-4.5" />}
              title="Response Notes"
              trailing={
                <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {responseNotes.length} chars
                </span>
              }
            />
            <textarea
              ref={responseNotesRef}
              value={responseNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              disabled={isUpdating}
              placeholder="Add details about your response..."
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y disabled:opacity-50"
            />
          </div>

          {/* Loading */}
          {isUpdating && (
            <div className="flex items-center justify-center gap-2 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-xs font-medium text-blue-900 dark:text-blue-100">Updating...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 flex items-center justify-between gap-3">
          <p className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Info className="h-3.5 w-3.5" />
            Click status to save
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isUpdating}>
              Cancel
            </Button>
            <Button size="sm" onClick={onSendMessage} disabled={isUpdating || !responseNotes.trim()}>
              <Send className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ContactMessageListProps {
  initialPage: number;
  initialLimit: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

export function ContactMessageList({
  initialPage,
  initialLimit,
  initialSearchParams = {},
}: ContactMessageListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const MENU_URL = "/admin/inbox";
  const { can } = usePermissions();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState(
    getInitialParam("search") as string
  );
  const [statusFilter, setStatusFilter] = useState(
    getInitialParam("status") as string
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(
    null
  );
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);

  const [isStatusUpdateModalOpen, setIsStatusUpdateModalOpen] = useState(false);
  const [selectedMessageForStatusUpdate, setSelectedMessageForStatusUpdate] =
    useState<ContactMessage | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Status update form state
  const [selectedActionTaken, setSelectedActionTaken] = useState<ActionTaken | "">("");
  const [selectedStatus, setSelectedStatus] = useState<ContactStatus>(ContactStatus.PENDING);
  const [responseNotes, setResponseNotes] = useState("");
  const responseNotesRef = useRef<HTMLTextAreaElement>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMessageForDetail, setSelectedMessageForDetail] =
    useState<ContactMessage | null>(null);

  // Statistics state
  const [statistics, setStatistics] = useState<{
    total: number;
    byStatus: {
      pending: number;
      in_progress: number;
      resolved: number;
      closed: number;
    };
  }>({
    total: 0,
    byStatus: {
      pending: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    },
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", currentPage.toString());
    params.set("limit", limit.toString());
    if (searchQuery) params.set("search", searchQuery);
    if (statusFilter && statusFilter !== "all")
      params.set("status", statusFilter);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, currentPage, limit, searchQuery, statusFilter]);

  const fetchStatistics = async () => {
    setIsLoadingStats(true);
    try {
      const response = await fetchProtectedData<{
        total: number;
        byStatus: {
          pending: number;
          in_progress: number;
          resolved: number;
          closed: number;
        };
      }>("contact-messages/statistics");

      setStatistics(response);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      toast.error("Failed to load statistics");
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter && statusFilter !== "all")
        params.append("status", statusFilter);

      const response = await fetchDataPagination<{
        data: ContactMessage[];
        total: number;
        totalPages: number;
      }>(`contact-messages?${params.toString()}`);

      setMessages(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching contact messages:", error);
      toast.error("Failed to load contact messages. Please try again.");
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchStatistics();
  }, []);

  useEffect(() => {
    fetchMessages();
    updateUrl();
  }, [currentPage, limit, searchQuery, statusFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDeleteClick = (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedMessage) return;

    try {
      await deleteData("contact-messages", selectedMessage.id);
      fetchMessages();
      fetchStatistics();
      toast.success("Contact message deleted successfully");
    } catch (error) {
      console.error("Error deleting contact message:", error);
      toast.error("Failed to delete contact message. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleStatusUpdateClick = (message: ContactMessage) => {
    setSelectedMessageForStatusUpdate(message);
    setSelectedActionTaken(message.actionTaken || "");
    setSelectedStatus(message.contactStatus as ContactStatus);
    setResponseNotes(message.responseNotes || "");
    setIsStatusUpdateModalOpen(true);
  };

  const handleViewDetails = (message: ContactMessage) => {
    setSelectedMessageForDetail(message);
    setIsDetailModalOpen(true);
  };

  const handleStatusUpdate = async (newStatus: ContactStatus) => {
    setSelectedStatus(newStatus);
  };

  const handleSendMessage = async () => {
    if (!selectedMessageForStatusUpdate || !responseNotes.trim()) return;

    setIsUpdatingStatus(true);
    try {
      await postData(`contact-messages/${selectedMessageForStatusUpdate.id}/reply`, {
        responseNotes: responseNotes.trim(),
        contactStatus: selectedStatus,
      });
      await fetchMessages();
      await fetchStatistics();
      toast.success("Message sent successfully");
      setIsStatusUpdateModalOpen(false);
      setSelectedMessageForStatusUpdate(null);
      setSelectedActionTaken("");
      setResponseNotes("");
    } catch (error) {
      console.error("Error sending contact response:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const getActionTakenBadge = (actionTaken: ActionTaken | null | undefined) => {
    if (!actionTaken) return null;

    const actionConfig: Record<ActionTaken, { icon: React.ReactNode; label: string; color: string }> = {
      replied_via_email: {
        icon: <Send className="h-3 w-3" />,
        label: "Replied via Email",
        color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
      },
      called_customer: {
        icon: <PhoneCall className="h-3 w-3" />,
        label: "Called Customer",
        color: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
      },
      provided_product_info: {
        icon: <Package className="h-3 w-3" />,
        label: "Provided Product Info",
        color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
      },
      issue_resolved: {
        icon: <CheckCircle className="h-3 w-3" />,
        label: "Issue Resolved",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
      },
      order_placed: {
        icon: <ShoppingCart className="h-3 w-3" />,
        label: "Order Placed",
        color: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
      },
      refund_processed: {
        icon: <RefreshCw className="h-3 w-3" />,
        label: "Refund Processed",
        color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
      },
      other: {
        icon: <FileText className="h-3 w-3" />,
        label: "Other",
        color: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800",
      },
    };

    const config = actionConfig[actionTaken];
    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${config.color}`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case ContactStatus.PENDING:
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case ContactStatus.IN_PROGRESS:
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            In Progress
          </Badge>
        );
      case ContactStatus.RESOLVED:
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 text-green-600 border-green-600"
          >
            <CheckCircle className="h-3 w-3" />
            Resolved
          </Badge>
        );
      case ContactStatus.CLOSED:
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Closed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStatisticsCards = () => {
    if (isLoadingStats) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800 animate-pulse"
            >
              <div className="h-4 bg-gray-200 dark:bg-neutral-800 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-neutral-800 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      );
    }

    const stats = [
      {
        title: "Total Messages",
        value: statistics.total,
        icon: MessageSquare,
        bgColor: "blue" as const,
      },
      {
        title: "Pending",
        value: statistics.byStatus.pending,
        icon: Clock,
        bgColor: "amber" as const,
      },
      {
        title: "In Progress",
        value: statistics.byStatus.in_progress,
        icon: AlertCircle,
        bgColor: "indigo" as const,
      },
      {
        title: "Resolved",
        value: statistics.byStatus.resolved,
        icon: CheckCircle,
        bgColor: "green" as const,
      },
      {
        title: "Closed",
        value: statistics.byStatus.closed,
        icon: XCircle,
        bgColor: "red" as const,
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {stats.map((stat) => (
          <StatsCard
            key={stat.title}
            icon={stat.icon}
            title={stat.title}
            value={stat.value}
            bgColor={stat.bgColor}
          />
        ))}
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <MessageSquare className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No contact messages found</h3>
      <p className="text-sm text-muted-foreground mt-2">
        {searchQuery || statusFilter
          ? "No messages match your search criteria. Try different filters."
          : "No contact messages have been received yet."}
      </p>
      {(searchQuery || statusFilter) && (
        <Button
          variant="outline"
          className="mt-4 bg-transparent"
          onClick={clearFilters}
        >
          Clear Filters
        </Button>
      )}
    </div>
  );

  const renderActiveFilters = () => {
    const hasFilters = searchQuery || statusFilter;
    if (!hasFilters) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {searchQuery && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Search: {searchQuery}
            <button onClick={() => setSearchQuery("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}
        {statusFilter && statusFilter !== "all" && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Status: {statusFilter.replace("_", " ")}
            <button onClick={() => setStatusFilter("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-7 text-xs"
        >
          Clear all
        </Button>
      </div>
    );
  };

  const renderTableView = () => (
    <div className="md:p-6 p-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">Contact Info</TableHead>
            <TableHead>Message</TableHead>
            <TableHead className="hidden lg:table-cell">Status</TableHead>
            <TableHead className="hidden lg:table-cell">Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {messages.map((message) => (
            <TableRow key={message.id}>
              <TableCell className="font-medium">
                <div>
                  <div className="font-semibold">{message.name}</div>
                  <div className="text-xs text-muted-foreground md:hidden">
                    {message.email}
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm">
                    <Mail className="h-3 w-3" />
                    {message.email}
                  </div>
                  {message.mobile && (
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="h-3 w-3" />
                      {message.mobile}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-xs truncate" title={message.message}>
                  {message.message}
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {getStatusBadge(message.contactStatus)}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                {formatDate(message.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewDetails(message)}>
                      <Eye className="mr-2 h-4 w-4" /> View Details
                    </DropdownMenuItem>
                    {can(MENU_URL, "canEdit") && (
                      <DropdownMenuItem
                        onClick={() => handleStatusUpdateClick(message)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" /> Update Status
                      </DropdownMenuItem>
                    )}
                    {can(MENU_URL, "canDelete") && (
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteClick(message)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
      <div className="w-full md:p-6 p-2">
        <PageHeader
          title="Contact Messages"
          description="Manage customer inquiries and messages"
        />

        {renderStatisticsCards()}

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search messages..."
                className="pl-8"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 px-3 bg-transparent"
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 p-3 rounded-lg shadow-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800"
                  sideOffset={8}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Filters</h4>
                      {statusFilter && statusFilter !== "all" && (
                        <button
                          onClick={clearFilters}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">
                        Status
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setStatusFilter("all");
                            setCurrentPage(1);
                          }}
                          className={`text-xs py-1.5 px-2 rounded-md border ${
                            statusFilter === "all"
                              ? "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                              : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => {
                            setStatusFilter(ContactStatus.PENDING);
                            setCurrentPage(1);
                          }}
                          className={`text-xs py-1.5 px-2 rounded-md border flex items-center justify-center gap-1 ${
                            statusFilter === ContactStatus.PENDING
                              ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400"
                              : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                          }`}
                        >
                          <Clock className="h-2 w-2" />
                          Pending
                        </button>
                        <button
                          onClick={() => {
                            setStatusFilter(ContactStatus.IN_PROGRESS);
                            setCurrentPage(1);
                          }}
                          className={`text-xs py-1.5 px-2 rounded-md border flex items-center justify-center gap-1 ${
                            statusFilter === ContactStatus.IN_PROGRESS
                              ? "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                              : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                          }`}
                        >
                          <AlertCircle className="h-2 w-2" />
                          In Progress
                        </button>
                        <button
                          onClick={() => {
                            setStatusFilter(ContactStatus.RESOLVED);
                            setCurrentPage(1);
                          }}
                          className={`text-xs py-1.5 px-2 rounded-md border flex items-center justify-center gap-1 ${
                            statusFilter === ContactStatus.RESOLVED
                              ? "bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800 text-green-600 dark:text-green-400"
                              : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                          }`}
                        >
                          <CheckCircle className="h-2 w-2" />
                          Resolved
                        </button>
                      </div>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {renderActiveFilters()}

          {isLoading ? (
            <LoadingIndicator message="Loading Contact Messages..." />
          ) : messages.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="mt-6">{renderTableView()}</div>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground text-center md:text-left truncate">
              {`Showing ${messages.length} of ${totalItems} messages`}
            </p>
          </div>
          <div className="flex-1 w-full md:w-auto">
            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl="#"
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
      <StatusUpdateModal
        isOpen={isStatusUpdateModalOpen}
        message={selectedMessageForStatusUpdate}
        selectedAction={selectedActionTaken}
        selectedStatus={selectedStatus}
        responseNotes={responseNotes}
        isUpdating={isUpdatingStatus}
        onClose={() => {
          setIsStatusUpdateModalOpen(false);
          setSelectedActionTaken("");
          setResponseNotes("");
        }}
        onUpdateStatus={handleStatusUpdate}
        onSendMessage={handleSendMessage}
        onActionChange={setSelectedActionTaken}
        onNotesChange={setResponseNotes}
        responseNotesRef={responseNotesRef}
        formatDate={formatDate}
      />

      {/* Message Detail Modal */}
      {isDetailModalOpen && selectedMessageForDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Message Details</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDetailModalOpen(false)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Customer Information
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="text-sm font-medium min-w-[100px]">Name:</span>
                    <span className="text-sm">{selectedMessageForDetail.name}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <a
                      href={`mailto:${selectedMessageForDetail.email}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {selectedMessageForDetail.email}
                    </a>
                  </div>
                  {selectedMessageForDetail.mobile && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <a
                        href={`tel:${selectedMessageForDetail.mobile}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {selectedMessageForDetail.mobile}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Message */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Message
                </h4>
                <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedMessageForDetail.message}
                  </p>
                </div>
              </div>

              {/* Status and Dates */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Status & Timeline
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">
                      Current Status
                    </span>
                    {getStatusBadge(selectedMessageForDetail.contactStatus)}
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">
                      Received
                    </span>
                    <span className="text-sm">
                      {formatDate(selectedMessageForDetail.createdAt)}
                    </span>
                  </div>
                </div>
                {selectedMessageForDetail.updatedAt !== selectedMessageForDetail.createdAt && (
                  <div className="text-xs text-muted-foreground">
                    Last updated: {formatDate(selectedMessageForDetail.updatedAt)}
                  </div>
                )}
              </div>

              {/* Action Taken */}
              {selectedMessageForDetail.actionTaken && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Action Taken
                  </h4>
                  <div>
                    {getActionTakenBadge(selectedMessageForDetail.actionTaken)}
                  </div>
                </div>
              )}

              {/* Response Notes */}
              {selectedMessageForDetail.responseNotes && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Response Notes
                  </h4>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedMessageForDetail.responseNotes}
                    </p>
                  </div>
                </div>
              )}

              {/* Handler Info */}
              {selectedMessageForDetail.handledBy && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Assigned Handler
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {selectedMessageForDetail.handledBy}
                    </span>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                {can(MENU_URL, "canEdit") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleStatusUpdateClick(selectedMessageForDetail);
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Update Status
                  </Button>
                )}
                {can(MENU_URL, "canDelete") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleDeleteClick(selectedMessageForDetail);
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Message
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
