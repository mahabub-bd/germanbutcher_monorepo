"use client";

import type React from "react";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
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
import { deleteData, fetchDataPagination, fetchProtectedData, patchData, postData } from "@/utils/api-utils";
import type { ContactMessage } from "@/utils/types";
import { ActionTaken } from "@/utils/types";
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  AtSign,
  FileText,
  Filter,
  Flag,
  Globe,
  Info,
  Mail,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Package,
  Phone,
  PhoneCall,
  Plus,
  RefreshCw,
  Search,
  Send,
  Share2,
  ShoppingCart,
  Tag,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
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

export enum ContactSource {
  WEBSITE = "website",
  FACEBOOK = "facebook",
  PHONE = "phone",
  EMAIL = "email",
  WHATSAPP = "whatsapp",
  OTHER = "other",
}

export enum ContactPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

const PRIORITY_BADGES: Record<
  ContactPriority,
  { label: string; color: string }
> = {
  [ContactPriority.LOW]: {
    label: "Low",
    color:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  },
  [ContactPriority.MEDIUM]: {
    label: "Medium",
    color:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  },
  [ContactPriority.HIGH]: {
    label: "High",
    color:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  },
};

/** "2 hours ago" style — falls back to date for anything older than a week. */
const timeAgo = (dateString: string) => {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`;
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/** Display ticket number: id 1 → #TK-1001, id 42 → #TK-1042. */
const ticketNo = (id: number) => `#TK-${1000 + id}`;

const SOURCE_ICONS: Record<ContactSource, React.ComponentType<{ className?: string }>> = {
  [ContactSource.WEBSITE]: Globe,
  [ContactSource.FACEBOOK]: AtSign,
  [ContactSource.PHONE]: Phone,
  [ContactSource.EMAIL]: Mail,
  [ContactSource.WHATSAPP]: MessageCircle,
  [ContactSource.OTHER]: MoreHorizontal,
};

const SOURCE_BADGES: Record<ContactSource, { label: string; color: string }> = {
  [ContactSource.WEBSITE]: {
    label: "Website",
    color:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  },
  [ContactSource.FACEBOOK]: {
    label: "Facebook",
    color:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
  },
  [ContactSource.PHONE]: {
    label: "Phone",
    color:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  },
  [ContactSource.EMAIL]: {
    label: "Email",
    color:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  },
  [ContactSource.WHATSAPP]: {
    label: "WhatsApp",
    color:
      "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800",
  },
  [ContactSource.OTHER]: {
    label: "Other",
    color:
      "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800",
  },
};
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
  const [sourceFilter, setSourceFilter] = useState(
    getInitialParam("source") as string
  );
  const [priorityFilter, setPriorityFilter] = useState(
    getInitialParam("priority") as string
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

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [replyNotes, setReplyNotes] = useState("");

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMessageForDetail, setSelectedMessageForDetail] =
    useState<ContactMessage | null>(null);

  // Admin-logged ticket (phone / Facebook / WhatsApp walk-in inquiries)
  const [isAddTicketOpen, setIsAddTicketOpen] = useState(false);
  const [addTicketForm, setAddTicketForm] = useState({
    name: "",
    email: "",
    mobile: "",
    message: "",
    source: ContactSource.PHONE,
  });
  const [isAddingTicket, setIsAddingTicket] = useState(false);

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
    if (sourceFilter && sourceFilter !== "all")
      params.set("source", sourceFilter);
    if (priorityFilter && priorityFilter !== "all")
      params.set("priority", priorityFilter);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, currentPage, limit, searchQuery, statusFilter, sourceFilter, priorityFilter]);

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
      if (sourceFilter && sourceFilter !== "all")
        params.append("source", sourceFilter);
      if (priorityFilter && priorityFilter !== "all")
        params.append("priority", priorityFilter);

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
  }, [currentPage, limit, searchQuery, statusFilter, sourceFilter, priorityFilter]);

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

  const handleViewDetails = (message: ContactMessage) => {
    setSelectedMessageForDetail(message);
    setReplyNotes("");
    setIsDetailModalOpen(true);
  };

  const updateDetailMessage = (updated: ContactMessage) => {
    setSelectedMessageForDetail(updated);
    setMessages((prev) =>
      prev.map((msg) => (msg.id === updated.id ? updated : msg))
    );
  };

  const handleStatusChange = async (status: ContactStatus) => {
    if (!selectedMessageForDetail) return;
    setIsUpdatingStatus(true);
    try {
      await patchData(`contact-messages/${selectedMessageForDetail.id}`, {
        contactStatus: status,
      });
      updateDetailMessage({
        ...selectedMessageForDetail,
        contactStatus: status,
      });
      await fetchStatistics();
      toast.success(`Ticket marked as ${status.replace("_", " ")}.`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSourceChange = async (source: ContactSource) => {
    if (!selectedMessageForDetail) return;
    setIsUpdatingStatus(true);
    try {
      await patchData(`contact-messages/${selectedMessageForDetail.id}`, {
        source,
      });
      updateDetailMessage({ ...selectedMessageForDetail, source });
      toast.success(`Source set to ${source}.`);
    } catch (error) {
      console.error("Error updating source:", error);
      toast.error("Failed to update source.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePriorityChange = async (priority: ContactPriority) => {
    if (!selectedMessageForDetail) return;
    setIsUpdatingStatus(true);
    try {
      await patchData(`contact-messages/${selectedMessageForDetail.id}`, {
        priority,
      });
      updateDetailMessage({ ...selectedMessageForDetail, priority });
      toast.success(`Priority set to ${priority}.`);
    } catch (error) {
      console.error("Error updating priority:", error);
      toast.error("Failed to update priority.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Sends the admin reply by email and stores it as the response note.
  const handleSendReply = async () => {
    if (!selectedMessageForDetail || !replyNotes.trim()) return;

    setIsUpdatingStatus(true);
    try {
      const result = await postData<{ data: ContactMessage }>(
        `contact-messages/${selectedMessageForDetail.id}/reply`,
        { responseNotes: replyNotes.trim() }
      );
      const updated = (result as any)?.data ?? result;
      if (updated?.id) {
        updateDetailMessage(updated as ContactMessage);
      } else {
        await fetchMessages();
      }
      await fetchStatistics();
      toast.success("Reply sent successfully");
      setReplyNotes("");
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
    setSourceFilter("");
    setPriorityFilter("");
    setCurrentPage(1);
  };

  const handleAddTicket = async () => {
    const { name, email, mobile, message, source } = addTicketForm;
    if (!name.trim() || !email.trim() || !mobile.trim() || !message.trim()) {
      toast.error("All fields are required.");
      return;
    }
    setIsAddingTicket(true);
    try {
      await postData("contact-messages", {
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        message: message.trim(),
        source,
      });
      toast.success("Ticket added.");
      setIsAddTicketOpen(false);
      setAddTicketForm({
        name: "",
        email: "",
        mobile: "",
        message: "",
        source: ContactSource.PHONE,
      });
      await fetchMessages();
      await fetchStatistics();
    } catch (error) {
      console.error("Error adding ticket:", error);
      toast.error("Failed to add ticket.");
    } finally {
      setIsAddingTicket(false);
    }
  };


  const getPriorityBadge = (priority: ContactMessage["priority"]) => {
    if (!priority) return null;
    const config = PRIORITY_BADGES[priority as ContactPriority];
    if (!config) return null;
    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${config.color}`}>
        {config.label}
      </Badge>
    );
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
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
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
        {sourceFilter && sourceFilter !== "all" && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Source: {sourceFilter}
            <button onClick={() => setSourceFilter("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}
        {priorityFilter && priorityFilter !== "all" && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1 capitalize"
          >
            Priority: {priorityFilter}
            <button onClick={() => setPriorityFilter("")} className="ml-1">
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


  // Card-style ticket list (first line of the message acts as the subject).
  const renderTicketList = () => (
    <div className="rounded-xl border border-gray-200 dark:border-neutral-800 divide-y divide-gray-100 dark:divide-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
      {messages.map((message) => {
        const firstLine = message.message.split("\n")[0] ?? "";
        const subject = firstLine.length > 70 ? `${firstLine.slice(0, 70)}…` : firstLine;
        const preview = message.message.length > 120 ? `${message.message.slice(0, 120)}…` : message.message;

        return (
          <div
            key={message.id}
            onClick={() => handleViewDetails(message)}
            className="flex items-start gap-4 px-4 py-4 hover:bg-gray-50 dark:hover:bg-neutral-800/60 cursor-pointer transition-colors"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-sm font-bold text-blue-700 dark:text-blue-300">
              {message.name?.charAt(0).toUpperCase() || "?"}
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {subject}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {preview}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5 flex items-center gap-1.5 flex-wrap">
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
            </div>

            <div className="shrink-0 flex flex-col items-end gap-1.5">
              <span className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                {timeAgo(message.createdAt)}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {getPriorityBadge(message.priority)}
                {getStatusBadge(message.contactStatus)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <div className="w-full ">
        <PageHeader
          title="Support Tickets"
          description="Customer inquiries from all channels — assign, prioritize and resolve"
        />

        {renderStatisticsCards()}

        {/* Status tabs (mockup style) */}
        <div className="flex items-center gap-1 border-b border-gray-200 dark:border-neutral-800 overflow-x-auto -mb-px">
          {[
            { value: "all", label: "All", count: statistics.total },
            {
              value: ContactStatus.PENDING,
              label: "Open",
              count: statistics.byStatus.pending,
            },
            {
              value: ContactStatus.IN_PROGRESS,
              label: "In Progress",
              count: statistics.byStatus.in_progress,
            },
            {
              value: ContactStatus.RESOLVED,
              label: "Resolved",
              count: statistics.byStatus.resolved,
            },
            {
              value: ContactStatus.CLOSED,
              label: "Closed",
              count: statistics.byStatus.closed,
            },
          ].map((tab) => {
            const active =
              statusFilter === tab.value ||
              (tab.value === "all" && !statusFilter);
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value === "all" ? "" : tab.value);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${active
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="flex flex-row justify-between gap-2 pt-3">
            <div className="relative w-full sm:max-w-xs min-w-0">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search messages..."
                className="h-8 pl-8"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            <div className="flex items-center gap-2">
              {can(MENU_URL, "canCreate") && (
                <Button
                  size="sm"
                  onClick={() => setIsAddTicketOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Ticket
                </Button>
              )}
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
                          className={`text-xs py-1.5 px-2 rounded-md border ${statusFilter === "all"
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
                          className={`text-xs py-1.5 px-2 rounded-md border flex items-center justify-center gap-1 ${statusFilter === ContactStatus.PENDING
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
                          className={`text-xs py-1.5 px-2 rounded-md border flex items-center justify-center gap-1 ${statusFilter === ContactStatus.IN_PROGRESS
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
                          className={`text-xs py-1.5 px-2 rounded-md border flex items-center justify-center gap-1 ${statusFilter === ContactStatus.RESOLVED
                            ? "bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800 text-green-600 dark:text-green-400"
                            : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                            }`}
                        >
                          <CheckCircle className="h-2 w-2" />
                          Resolved
                        </button>
                      </div>
                    </div>

                    {/* Source channel */}
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">
                        Source
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.values(ContactSource).map((source) => (
                          <button
                            key={source}
                            onClick={() => {
                              setSourceFilter(source);
                              setCurrentPage(1);
                            }}
                            className={`text-xs py-1.5 px-2 rounded-md border capitalize ${sourceFilter === source
                              ? "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                              : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                              }`}
                          >
                            {source}
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            setSourceFilter("");
                            setCurrentPage(1);
                          }}
                          className={`text-xs py-1.5 px-2 rounded-md border ${sourceFilter === ""
                            ? "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                            : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                            }`}
                        >
                          All
                        </button>
                      </div>
                    </div>

                    {/* Priority */}
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">
                        Priority
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {Object.values(ContactPriority).map((priority) => (
                          <button
                            key={priority}
                            onClick={() => {
                              setPriorityFilter(priority);
                              setCurrentPage(1);
                            }}
                            className={`text-xs py-1.5 px-2 rounded-md border capitalize ${priorityFilter === priority
                              ? "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                              : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                              }`}
                          >
                            {priority}
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            setPriorityFilter("");
                            setCurrentPage(1);
                          }}
                          className={`text-xs py-1.5 px-2 rounded-md border ${priorityFilter === ""
                            ? "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                            : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                            }`}
                        >
                          All
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
            <div className="mt-6">{renderTicketList()}</div>
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

      {/* Add Ticket Dialog */}
      {isAddTicketOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Add Ticket
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Log an inquiry that arrived by phone, Facebook, WhatsApp, etc.
                </p>
              </div>
              <button
                onClick={() => setIsAddTicketOpen(false)}
                className="p-2 border border-gray-200 dark:border-neutral-700 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800"
              >
                <XCircle className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Source</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(ContactSource).map((source) => (
                    <button
                      key={source}
                      type="button"
                      onClick={() =>
                        setAddTicketForm({ ...addTicketForm, source })
                      }
                      className={`text-xs py-2 px-2 rounded-md border capitalize ${addTicketForm.source === source
                        ? "bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-950/40"
                        : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                        }`}
                    >
                      {source}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={addTicketForm.name}
                  onChange={(e) =>
                    setAddTicketForm({ ...addTicketForm, name: e.target.value })
                  }
                  placeholder="Customer name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={addTicketForm.email}
                  onChange={(e) =>
                    setAddTicketForm({ ...addTicketForm, email: e.target.value })
                  }
                  placeholder="customer@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Mobile</label>
                <Input
                  value={addTicketForm.mobile}
                  onChange={(e) =>
                    setAddTicketForm({
                      ...addTicketForm,
                      mobile: e.target.value,
                    })
                  }
                  placeholder="+8801XXXXXXXXX"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Message</label>
                <textarea
                  value={addTicketForm.message}
                  onChange={(e) =>
                    setAddTicketForm({
                      ...addTicketForm,
                      message: e.target.value,
                    })
                  }
                  rows={4}
                  placeholder="What the customer asked..."
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddTicketOpen(false)}
                disabled={isAddingTicket}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddTicket} disabled={isAddingTicket}>
                {isAddingTicket ? "Saving..." : "Save Ticket"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Message Detail Modal */}
      {isDetailModalOpen && selectedMessageForDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-7xl max-h-[94vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDetailModalOpen(false)}
                  aria-label="Back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                  <MessageSquare className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {ticketNo(selectedMessageForDetail.id)}
                    </h3>
                    {getPriorityBadge(selectedMessageForDetail.priority)}
                  </div>
                  <p className="text-xs text-gray-400">
                    Created on {formatDate(selectedMessageForDetail.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {can(MENU_URL, "canDelete") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/40"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleDeleteClick(selectedMessageForDetail);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDetailModalOpen(false)}
                  aria-label="Close"
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="p-6 grid lg:grid-cols-3 gap-5">
              {/* LEFT — main ticket area */}
              <div className="lg:col-span-2 space-y-5">
                {/* Customer card */}
                <div className="rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50/60 dark:bg-neutral-800/50 p-4 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-base font-bold text-blue-700 dark:text-blue-300">
                      {selectedMessageForDetail.name?.charAt(0).toUpperCase() || "?"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-base font-bold text-gray-900 dark:text-white truncate">
                        {selectedMessageForDetail.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                        <a
                          href={`mailto:${selectedMessageForDetail.email}`}
                          className="flex items-center gap-1 hover:text-blue-600"
                        >
                          <Mail className="h-3 w-3" />
                          {selectedMessageForDetail.email}
                        </a>
                        {selectedMessageForDetail.mobile && (
                          <>
                            <span className="text-gray-300">|</span>
                            <a
                              href={`tel:${selectedMessageForDetail.mobile}`}
                              className="flex items-center gap-1 hover:text-blue-600"
                            >
                              <Phone className="h-3 w-3" />
                              {selectedMessageForDetail.mobile}
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
                        {formatDate(selectedMessageForDetail.createdAt)}
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
                        const active =
                          selectedMessageForDetail.contactStatus === status;
                        return (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(status)}
                            disabled={isUpdatingStatus || !can(MENU_URL, "canEdit")}
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
                        const active = selectedMessageForDetail.source === source;
                        const Icon = SOURCE_ICONS[source];
                        return (
                          <button
                            key={source}
                            onClick={() => handleSourceChange(source)}
                            disabled={isUpdatingStatus || !can(MENU_URL, "canEdit")}
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
                          (selectedMessageForDetail.priority ?? "medium") ===
                          priority;
                        return (
                          <button
                            key={priority}
                            onClick={() => handlePriorityChange(priority)}
                            disabled={isUpdatingStatus || !can(MENU_URL, "canEdit")}
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
                    {selectedMessageForDetail.name?.charAt(0).toUpperCase() || "?"}
                  </span>
                  <div className="flex-1 min-w-0 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 px-4 py-3">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                      {selectedMessageForDetail.name}
                      <span className="ml-2 font-normal text-gray-400">
                        {timeAgo(selectedMessageForDetail.createdAt)}
                      </span>
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mt-1">
                      {selectedMessageForDetail.message}
                    </p>
                  </div>
                </div>

                {/* Admin reply (latest response) */}
                {selectedMessageForDetail.responseNotes && (
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-xs font-bold text-blue-700 dark:text-blue-300">
                      MH
                    </span>
                    <div className="flex-1 min-w-0 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 px-4 py-3">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">
                        Support
                        {selectedMessageForDetail.handledBy
                          ? ` (${selectedMessageForDetail.handledBy})`
                          : ""}
                        <span className="ml-2 font-normal text-gray-400">
                          {timeAgo(selectedMessageForDetail.updatedAt)}
                        </span>
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mt-1">
                        {selectedMessageForDetail.responseNotes}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Reply box */}
              {can(MENU_URL, "canEdit") && (
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
                      disabled={isUpdatingStatus}
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
                        disabled={isUpdatingStatus || !replyNotes.trim()}
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
                        {ticketNo(selectedMessageForDetail.id)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-gray-500 dark:text-gray-400">Status</dt>
                      <dd>{getStatusBadge(selectedMessageForDetail.contactStatus)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Flag className="h-3.5 w-3.5" /> Priority
                      </dt>
                      <dd>{getPriorityBadge(selectedMessageForDetail.priority)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Share2 className="h-3.5 w-3.5" /> Source
                      </dt>
                      <dd>
                        <span className="text-sm capitalize text-gray-900 dark:text-white">
                          {selectedMessageForDetail.source ?? "—"}
                        </span>
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Calendar className="h-3.5 w-3.5" /> Created At
                      </dt>
                      <dd className="text-xs text-gray-700 dark:text-gray-300">
                        {formatDate(selectedMessageForDetail.createdAt)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <RefreshCw className="h-3.5 w-3.5" /> Updated At
                      </dt>
                      <dd className="text-xs text-gray-700 dark:text-gray-300">
                        {formatDate(selectedMessageForDetail.updatedAt)}
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
                      {selectedMessageForDetail.name?.charAt(0).toUpperCase() || "?"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {selectedMessageForDetail.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {selectedMessageForDetail.email}
                      </p>
                      {selectedMessageForDetail.mobile && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedMessageForDetail.mobile}
                        </p>
                      )}
                    </div>
                  </div>
                  {selectedMessageForDetail.userId && (
                    <Link
                      href={`/admin/crm/customers/${selectedMessageForDetail.userId}`}
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
      )}
    </>
  );
}
