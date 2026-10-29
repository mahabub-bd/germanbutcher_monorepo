"use client";

import { Badge } from "@/components/ui/badge";
import type { ContactMessage } from "@/utils/types";
import {
  AtSign,
  Globe,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Phone,
} from "lucide-react";
import type React from "react";

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

export interface TicketStatistics {
  total: number;
  byStatus: {
    pending: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
}

const PRIORITY_BADGES: Record<
  ContactPriority,
  { label: string; color: string; dot: string }
> = {
  [ContactPriority.LOW]: {
    label: "Low",
    color:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    dot: "bg-emerald-500 dark:bg-emerald-400",
  },
  [ContactPriority.MEDIUM]: {
    label: "Medium",
    color: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    dot: "bg-amber-500 dark:bg-amber-400",
  },
  [ContactPriority.HIGH]: {
    label: "High",
    color: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
    dot: "bg-rose-500 dark:bg-rose-400",
  },
};

const STATUS_BADGES: Record<
  ContactStatus,
  { label: string; color: string; dot: string }
> = {
  [ContactStatus.PENDING]: {
    label: "Pending",
    color: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    dot: "bg-amber-500 dark:bg-amber-400",
  },
  [ContactStatus.IN_PROGRESS]: {
    label: "In Progress",
    color: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
    dot: "bg-blue-500 dark:bg-blue-400",
  },
  [ContactStatus.RESOLVED]: {
    label: "Resolved",
    color:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    dot: "bg-emerald-500 dark:bg-emerald-400",
  },
  [ContactStatus.CLOSED]: {
    label: "Closed",
    color:
      "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400",
    dot: "bg-slate-400 dark:bg-slate-500",
  },
};

/** Soft, borderless pill with a status dot — used for status and priority. */
function TicketBadge({
  label,
  color,
  dot,
}: {
  label: string;
  color: string;
  dot: string;
}) {
  return (
    <Badge
      variant="outline"
      className={`gap-1.5 rounded-full border-0 px-2.5 py-0.5 font-medium ${color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </Badge>
  );
}

export const getPriorityBadge = (priority: ContactMessage["priority"]) => {
  if (!priority) return null;
  const config = PRIORITY_BADGES[priority as ContactPriority];
  if (!config) return null;
  return (
    <TicketBadge label={config.label} color={config.color} dot={config.dot} />
  );
};

export const getStatusBadge = (status: string) => {
  const config = STATUS_BADGES[status as ContactStatus];
  if (!config) {
    return (
      <Badge variant="secondary" className="rounded-full border-0 capitalize">
        {status?.replace("_", " ")}
      </Badge>
    );
  }
  return (
    <TicketBadge label={config.label} color={config.color} dot={config.dot} />
  );
};

/** "2 hours ago" style — falls back to date for anything older than a week. */
export const timeAgo = (dateString: string) => {
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
export const ticketNo = (id: number) => `#TK-${1000 + id}`;

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const SOURCE_ICONS: Record<
  ContactSource,
  React.ComponentType<{ className?: string }>
> = {
  [ContactSource.WEBSITE]: Globe,
  [ContactSource.FACEBOOK]: AtSign,
  [ContactSource.PHONE]: Phone,
  [ContactSource.EMAIL]: Mail,
  [ContactSource.WHATSAPP]: MessageCircle,
  [ContactSource.OTHER]: MoreHorizontal,
};
