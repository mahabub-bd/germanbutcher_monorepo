"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { fetchProtectedData } from "@/utils/api-utils";
import type { UserActivity } from "@/utils/types";
import {
  ArrowLeft,
  Clock,
  Copy,
  Globe,
  Server,
  Shield,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../../loading-indicator";
import { PageHeader } from "../../page-header";

/* -----------------------------------------------------
Helper Components
-----------------------------------------------------*/

function InfoRow({
  label,
  value,
  copy,
}: {
  label: string;
  value: React.ReactNode;
  copy?: string;
}) {
  const copyValue = () => {
    if (!copy) return;
    navigator.clipboard.writeText(copy);
    toast.success("Copied");
  };

  return (
    <div className="min-w-0">
      <p className="mb-0.5 text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex items-start gap-1.5">
        <div className="min-w-0 break-all text-sm font-medium">{value}</div>
        {copy && (
          <Button
            variant="ghost"
            size="icon"
            className="size-6 shrink-0"
            onClick={copyValue}
            aria-label={`Copy ${label}`}
          >
            <Copy className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

function JsonViewer({ data }: { data: unknown }) {
  if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
    return <span className="text-sm italic text-muted-foreground">null</span>;
  }

  return (
    <pre className="max-h-80 overflow-auto rounded-md border bg-muted/50 p-3 text-xs whitespace-pre-wrap break-all">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

/* Badge tones with dark-mode variants — the old bg-*-100/text-*-800
   pairs were unreadable on dark backgrounds */
const HTTP_METHOD_TONES: Record<string, string> = {
  GET: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  POST: "bg-green-500/10 text-green-700 dark:text-green-400",
  PUT: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  PATCH: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  DELETE: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const STATUS_TONES: Record<string, string> = {
  success: "bg-green-500/10 text-green-700 dark:text-green-400",
  failed: "bg-red-500/10 text-red-700 dark:text-red-400",
  error: "bg-red-500/10 text-red-700 dark:text-red-400",
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

const FALLBACK_TONE = "bg-muted text-foreground";

/* -----------------------------------------------------
Main Component
-----------------------------------------------------*/

export function ActivityDetails({ activityId }: { activityId: string }) {
  const router = useRouter();

  const [activity, setActivity] = useState<UserActivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = activityId;

  /* -----------------------------------------------------
  Fetch Activity
  -----------------------------------------------------*/

  const fetchActivityDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchProtectedData<UserActivity>(
        `user-activities/details/${id}`
      );
      setActivity(response);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load activity details";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchActivityDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const formatAction = (action: string) => {
    const [method, ...path] = action.split(" ");
    if (path.length > 0) {
      return { method, path: path.join(" ") };
    }
    return { method: action, path: "" };
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <LoadingIndicator message="Loading activity details..." />
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="p-4 text-center md:p-6">
        <Shield className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="mb-2 text-xl font-semibold">Activity Not Found</h2>
        <p className="mb-4 text-muted-foreground">{error}</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  const { method, path } = formatAction(activity.action);
  const methodTone =
    HTTP_METHOD_TONES[method.toUpperCase()] ?? FALLBACK_TONE;
  const statusTone =
    STATUS_TONES[activity.status.toLowerCase()] ?? FALLBACK_TONE;

  return (
    <div className="space-y-4  md:space-y-6 ">
      {/* Header */}
      <PageHeader
        title="Activity Details"
        description="Security audit log event"
        titleIcon={<Shield className="size-6 text-primaryColor" />}
      >
        <Button variant="outline" asChild>
          <Link href="/admin/audit-log">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      {/* Activity Summary */}
      <Card className="rounded-sm">
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between lg:p-6">
          <div className="flex min-w-0 items-center gap-3">
            <Badge className={`${methodTone} shrink-0`}>{method}</Badge>
            <code className="min-w-0 break-all text-sm">{path}</code>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t pt-3 lg:flex lg:flex-wrap lg:gap-6 lg:border-t-0 lg:pt-0">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Status
              </p>
              <Badge className={`${statusTone} mt-1`}>{activity.status}</Badge>
            </div>

            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Actor
              </p>
              <p className="mt-1 truncate text-sm font-medium">
                {activity.user?.name || "Unknown"}
              </p>
            </div>

            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Time
              </p>
              <p className="mt-1 truncate text-sm font-medium">
                {formatDateTime(activity.createdAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-4 lg:col-span-2 lg:space-y-6">
          {/* Action Details */}
          <Card className="rounded-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Action Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <InfoRow label="Message" value={activity.message} />
              <InfoRow label="Entity Type" value={activity.entityType} />
              <InfoRow
                label="Entity ID"
                value={activity.entityId ?? "N/A"}
                copy={
                  activity.entityId != null
                    ? String(activity.entityId)
                    : undefined
                }
              />
            </CardContent>
          </Card>

          {/* Data Changes */}
          <Card className="rounded-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Data Changes
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="min-w-0">
                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                  Old Value
                </p>
                <JsonViewer data={activity.oldValue} />
              </div>

              <div className="min-w-0">
                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                  New Value
                </p>
                <JsonViewer data={activity.newValue} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4 lg:space-y-6">
          {/* User */}
          <Card className="rounded-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow
                label="User Name"
                value={activity.user?.name || "Unknown"}
              />
              <InfoRow
                label="Email"
                value={activity.user?.email || "N/A"}
                copy={activity.user?.email}
              />
              <InfoRow
                label="User ID"
                value={activity.user?.id ?? "N/A"}
                copy={
                  activity.user?.id != null
                    ? String(activity.user.id)
                    : undefined
                }
              />
            </CardContent>
          </Card>

          {/* Request Metadata */}
          <Card className="rounded-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Request Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow
                label="Request ID"
                value={activity.requestId}
                copy={activity.requestId}
              />
              <InfoRow
                label="Session ID"
                value={activity.sessionId || "N/A"}
                copy={activity.sessionId || undefined}
              />
              <InfoRow
                label="IP Address"
                value={activity.ipAddress}
                copy={activity.ipAddress}
              />
              <InfoRow label="User Agent" value={activity.userAgent} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
