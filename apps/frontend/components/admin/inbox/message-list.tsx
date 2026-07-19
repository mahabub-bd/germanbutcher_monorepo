"use client";

import type React from "react";

import { PaginationComponent } from "@/components/common/pagination";
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
import { deleteData, fetchDataPagination, fetchProtectedData, patchData } from "@/utils/api-utils";
import type { ContactMessage } from "@/utils/types";
import { ActionTaken } from "@/utils/types";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Filter,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Package,
  Phone,
  PhoneCall,
  RefreshCw,
  Search,
  Send,
  ShoppingCart,
  Trash2,
  XCircle,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
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
  responseNotes: string;
  isUpdating: boolean;
  onClose: () => void;
  onUpdateStatus: (status: ContactStatus) => void;
  onActionChange: (action: ActionTaken | "") => void;
  onNotesChange: (notes: string) => void;
  responseNotesRef: React.RefObject<HTMLTextAreaElement | null>;
  formatDate: (date: string) => string;
  getStatusBadge: (status: string) => React.ReactNode;
}

function StatusUpdateModal({
  isOpen,
  message,
  selectedAction,
  responseNotes,
  isUpdating,
  onClose,
  onUpdateStatus,
  onActionChange,
  onNotesChange,
  responseNotesRef,
  formatDate,
  getStatusBadge,
}: StatusUpdateModalProps) {
  if (!isOpen || !message) return null;

  const actionOptions: Array<{ value: ActionTaken; label: string; icon: React.ReactNode; color: string }> = [
    { value: ActionTaken.REPLIED_VIA_EMAIL, label: "Email", icon: <Send className="h-4 w-4" />, color: "blue" },
    { value: ActionTaken.CALLED_CUSTOMER, label: "Called", icon: <PhoneCall className="h-4 w-4" />, color: "green" },
    { value: ActionTaken.PROVIDED_PRODUCT_INFO, label: "Info", icon: <Package className="h-4 w-4" />, color: "purple" },
    { value: ActionTaken.ISSUE_RESOLVED, label: "Resolved", icon: <CheckCircle className="h-4 w-4" />, color: "emerald" },
    { value: ActionTaken.ORDER_PLACED, label: "Order", icon: <ShoppingCart className="h-4 w-4" />, color: "orange" },
    { value: ActionTaken.REFUND_PROCESSED, label: "Refund", icon: <RefreshCw className="h-4 w-4" />, color: "red" },
    { value: ActionTaken.OTHER, label: "Other", icon: <FileText className="h-4 w-4" />, color: "gray" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Update Status</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{message.name}</p>
          </div>
          <button onClick={onClose} disabled={isUpdating} className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
            <XCircle className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Customer Info */}
          <div className="bg-linear-to-br from-slate-50 to-slate-100 dark:from-neutral-800 dark:to-neutral-850 rounded-lg p-4 border border-gray-200 dark:border-neutral-700">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-white">{message.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{message.name}</h4>
                  <span className="text-xs text-gray-500">{formatDate(message.createdAt)}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs mb-2">
                  <a href={`mailto:${message.email}`} className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-600">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{message.email}</span>
                  </a>
                  {message.mobile && (
                    <a href={`tel:${message.mobile}`} className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-600">
                      <Phone className="h-3 w-3" />
                      <span>{message.mobile}</span>
                    </a>
                  )}
                </div>
                <div className="bg-white dark:bg-neutral-900 rounded p-2.5 border border-gray-200 dark:border-neutral-700">
                  <p className="text-xs text-gray-700 dark:text-gray-300 italic line-clamp-3">&ldquo;{message.message}&rdquo;</p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-amber-900 dark:text-amber-100 font-medium">Current: {message.contactStatus.replace("_", " ")}</p>
            </div>
          </div>

          {/* Status & Action Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">New Status</label>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.values(ContactStatus).map((status) => {
                  const isCurrent = message.contactStatus === status;
                  return (
                    <button
                      key={status}
                      onClick={() => onUpdateStatus(status)}
                      disabled={isUpdating || isCurrent}
                      className={`p-2.5 rounded-lg border text-center transition-all ${
                        isCurrent
                          ? 'border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 dark:border-neutral-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {status === ContactStatus.PENDING && <Clock className="h-4 w-4 text-yellow-600" />}
                        {status === ContactStatus.IN_PROGRESS && <AlertCircle className="h-4 w-4 text-blue-600" />}
                        {status === ContactStatus.RESOLVED && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {status === ContactStatus.CLOSED && <XCircle className="h-4 w-4 text-red-600" />}
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{status.replace("_", " ")}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Taken */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Action</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onMouseDown={(e) => { e.preventDefault(); onActionChange(""); }}
                  className={`p-2 rounded-lg border text-center transition-all text-xs ${
                    !selectedAction
                      ? 'border-gray-300 bg-white dark:bg-neutral-800 shadow-sm font-semibold'
                      : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300'
                  }`}
                  disabled={isUpdating}
                >
                  None
                </button>
                {actionOptions.map((action) => (
                  <button
                    key={action.value}
                    onMouseDown={(e) => { e.preventDefault(); onActionChange(action.value); }}
                    disabled={isUpdating}
                    title={action.label}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      selectedAction === action.value
                        ? `border-${action.color}-400 bg-${action.color}-50 dark:bg-${action.color}-900/20 shadow-sm`
                        : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <div className={selectedAction === action.value ? `text-${action.color}-600 dark:text-${action.color}-400` : 'text-gray-500'}>
                        {action.icon}
                      </div>
                      <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 leading-tight">{action.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase flex items-center justify-between">
              <span>Response Notes</span>
              <span className="text-[10px] text-gray-400 normal-case">{responseNotes.length} chars</span>
            </label>
            <textarea
              ref={responseNotesRef}
              value={responseNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              disabled={isUpdating}
              placeholder="Add details about your response..."
              rows={4}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y disabled:opacity-50"
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
        <div className="px-5 py-3 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 flex items-center justify-between">
          <p className="text-[10px] text-gray-500">Click status to save</p>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isUpdating}>Cancel</Button>
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
    setResponseNotes(message.responseNotes || "");
    setIsStatusUpdateModalOpen(true);
  };

  const handleViewDetails = (message: ContactMessage) => {
    setSelectedMessageForDetail(message);
    setIsDetailModalOpen(true);
  };

  const handleStatusUpdate = async (newStatus: ContactStatus) => {
    if (!selectedMessageForStatusUpdate) return;

    setIsUpdatingStatus(true);
    try {
      await patchData(`contact-messages/${selectedMessageForStatusUpdate.id}`, {
        contactStatus: newStatus,
        actionTaken: selectedActionTaken || null,
        responseNotes: responseNotes || null,
      });

      fetchMessages();
      fetchStatistics();
      toast.success("Status updated successfully");
      setIsStatusUpdateModalOpen(false);
      setSelectedMessageForStatusUpdate(null);
      setSelectedActionTaken("");
      setResponseNotes("");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status. Please try again.");
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
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
      },
      {
        title: "Pending",
        value: statistics.byStatus.pending,
        icon: Clock,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      },
      {
        title: "In Progress",
        value: statistics.byStatus.in_progress,
        icon: AlertCircle,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
      },
      {
        title: "Resolved",
        value: statistics.byStatus.resolved,
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-900/20",
      },
      {
        title: "Closed",
        value: statistics.byStatus.closed,
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-900/20",
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-800 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
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
                    <DropdownMenuItem
                      onClick={() => handleStatusUpdateClick(message)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" /> Update Status
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDeleteClick(message)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
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
        responseNotes={responseNotes}
        isUpdating={isUpdatingStatus}
        onClose={() => {
          setIsStatusUpdateModalOpen(false);
          setSelectedActionTaken("");
          setResponseNotes("");
        }}
        onUpdateStatus={handleStatusUpdate}
        onActionChange={setSelectedActionTaken}
        onNotesChange={setResponseNotes}
        responseNotesRef={responseNotesRef}
        formatDate={formatDate}
        getStatusBadge={getStatusBadge}
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
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
