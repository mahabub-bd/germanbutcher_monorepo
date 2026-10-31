"use client";

import { Button } from "@/components/ui/button";
import { cn, formatDateTime } from "@/lib/utils";
import { fetchProtectedData } from "@/utils/api-utils";
import type { UserActivity } from "@/utils/types";
import { ArrowLeft, Copy, Shield, User } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../../loading-indicator";
import { PageHeader } from "../../page-header";
import { MethodPill, StatusPill, formatAction } from "./audit-visuals";

/* -----------------------------------------------------
Helper Components
-----------------------------------------------------*/

function CopyButton({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-6 shrink-0 text-muted-foreground"
      onClick={() => {
        void navigator.clipboard.writeText(value);
        toast.success(`Copied ${label.toLowerCase()}`);
      }}
      aria-label={`Copy ${label}`}
    >
      <Copy className="size-3.5" />
    </Button>
  );
}

function DetailPanel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-xs",
        className
      )}
    >
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  copy,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  copy?: string;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 flex items-start gap-1">
        <div
          className={cn(
            "min-w-0 text-sm font-medium wrap-break-word",
            valueClassName
          )}
        >
          {value}
        </div>
        <CopyButton label={label} value={copy} />
      </div>
    </div>
  );
}

function JsonBlock({ label, data }: { label: string; data: unknown }) {
  const isEmpty =
    !data || (typeof data === "object" && Object.keys(data).length === 0);
  const json = isEmpty ? "" : JSON.stringify(data, null, 2);

  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <CopyButton label={label} value={json} />
      </div>

      {isEmpty ? (
        <div className="rounded-lg border border-dashed px-3 py-4 text-xs italic text-muted-foreground">
          Nothing recorded
        </div>
      ) : (
        <pre className="max-h-80 overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs whitespace-pre-wrap break-all">
          {json}
        </pre>
      )}
    </div>
  );
}

/* -----------------------------------------------------
Main Component
-----------------------------------------------------*/

export function ActivityDetails({ activityId }: { activityId: string }) {
  const [activity, setActivity] = useState<UserActivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = activityId;

  useEffect(() => {
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

    if (id) fetchActivityDetails();
  }, [id]);

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-xs">
        <LoadingIndicator message="Loading audit event..." />
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="w-full">
        <PageHeader
          title="Audit Event"
          description="Security audit log event"
        >
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/audit-log">
              <ArrowLeft className="size-3.5" />
              <span className="hidden sm:inline">Back to log</span>
            </Link>
          </Button>
        </PageHeader>

        <section className="flex flex-col items-center justify-center rounded-xl border bg-card px-6 py-16 text-center shadow-xs">
          <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
            <Shield className="size-6 text-muted-foreground" />
          </span>
          <h3 className="text-base font-semibold">Event not found</h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {error || `No audit event exists with ID ${id}.`}
          </p>
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link href="/admin/audit-log">
              <ArrowLeft className="size-3.5" />
              Back to audit log
            </Link>
          </Button>
        </section>
      </div>
    );
  }

  const { method, path } = formatAction(activity.action);

  /* Plain-text dump of the event, handy for security tickets. */
  const copyEvent = () => {
    const lines = [
      `Audit event #${activity.id}`,
      `Action: ${activity.action}`,
      `Status: ${activity.status}`,
      `Message: ${activity.message}`,
      `Entity: ${activity.entityType}${activity.entityId != null ? ` #${activity.entityId}` : ""
      }`,
      `Actor: ${activity.user?.name || "Unknown"} (${activity.userType}${activity.user?.email ? `, ${activity.user.email}` : ""
      })`,
      `IP: ${activity.ipAddress || "unknown"}`,
      `Request ID: ${activity.requestId || "-"}`,
      `Session ID: ${activity.sessionId || "-"}`,
      `User agent: ${activity.userAgent || "-"}`,
      `Recorded: ${formatDateTime(activity.createdAt)} (Dhaka) · ${activity.createdAt
      }`,
    ];

    void navigator.clipboard.writeText(lines.join("\n"));
    toast.success("Event copied");
  };

  return (
    <div className="w-full space-y-4">
      <PageHeader
        title={`Audit Event #${activity.id}`}
        description={`${method} on ${activity.entityType || "system"
          } · recorded ${formatDateTime(activity.createdAt)}`}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={copyEvent}
          title="Copy the full event as plain text"
        >
          <Copy className="size-3.5" />
          <span className="hidden sm:inline">Copy event</span>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/audit-log">
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline">Back to log</span>
          </Link>
        </Button>
      </PageHeader>

      {/* Summary */}
      <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
          <MethodPill method={method} />
          <StatusPill status={activity.status} />
          <code
            className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground"
            title={activity.action}
          >
            {path || activity.entityType || "—"}
          </code>
        </div>

        <dl className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3 md:p-5">
          <div className="min-w-0">
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Entity
            </dt>
            <dd className="mt-1 truncate text-sm font-medium capitalize">
              {activity.entityType || "—"}
              {activity.entityId != null && (
                <span className="ml-1 font-mono text-xs font-normal text-muted-foreground">
                  #{activity.entityId}
                </span>
              )}
            </dd>
          </div>

          <div className="min-w-0">
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Actor
            </dt>
            <dd className="mt-1 flex min-w-0 items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border bg-muted">
                <User className="size-3.5 text-muted-foreground" />
              </span>
              <span className="min-w-0 truncate text-sm font-medium">
                {activity.user?.name || "Unknown"}
                <span className="ml-1 text-xs font-normal text-muted-foreground capitalize">
                  ({activity.userType})
                </span>
              </span>
            </dd>
          </div>

          <div className="min-w-0">
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Recorded
            </dt>
            <dd className="mt-1 text-sm font-medium whitespace-nowrap">
              {formatDateTime(activity.createdAt)}
            </dd>
          </div>
        </dl>

        <div className="border-t px-4 py-3 md:px-5">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Message
          </p>
          <p className="mt-1 text-sm wrap-break-word">
            {activity.message || "—"}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Main column */}
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <DetailPanel
            title="Data changes"
            description="Field-level diff stored with the event"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <JsonBlock label="Old value" data={activity.oldValue} />
              <JsonBlock label="New value" data={activity.newValue} />
            </div>
          </DetailPanel>

          <DetailPanel
            title="Request metadata"
            description="Use these to correlate the event with server and proxy logs"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Full action"
                value={activity.action}
                copy={activity.action}
                valueClassName="font-mono text-xs font-normal wrap-break-word"
              />
              <Field
                label="IP Address"
                value={activity.ipAddress || "unknown"}
                copy={activity.ipAddress}
                valueClassName="font-mono text-xs font-normal"
              />
              <Field
                label="Request ID"
                value={activity.requestId || "—"}
                copy={activity.requestId}
                valueClassName="font-mono text-xs font-normal"
              />
              <Field
                label="Session ID"
                value={activity.sessionId || "—"}
                copy={activity.sessionId || undefined}
                valueClassName="font-mono text-xs font-normal"
              />
            </div>

            <div className="mt-4 border-t pt-4">
              <Field
                label="User agent"
                value={activity.userAgent || "—"}
                copy={activity.userAgent}
                valueClassName="text-xs font-normal"
              />
            </div>
          </DetailPanel>
        </div>

        {/* Sidebar */}
        <div className="min-w-0 space-y-4">
          <DetailPanel
            title="Actor"
            description={
              activity.user?.email
                ? activity.user.email
                : "Who triggered this event"
            }
          >
            <div className="space-y-4">
              <Field
                label="Name"
                value={activity.user?.name || "Unknown"}
                copy={activity.user?.name}
              />
              <Field
                label="Email"
                value={activity.user?.email || "—"}
                copy={activity.user?.email}
                valueClassName="text-xs font-normal"
              />
              <Field
                label="User ID"
                value={activity.user?.id ?? "—"}
                copy={
                  activity.user?.id != null ? String(activity.user.id) : undefined
                }
                valueClassName="font-mono text-xs font-normal"
              />
              <Field
                label="Actor Type"
                value={
                  <span className="capitalize">{activity.userType}</span>
                }
              />
            </div>
          </DetailPanel>

          <DetailPanel title="Event" description="Identifiers for this row">
            <div className="space-y-4">
              <Field
                label="Event ID"
                value={`#${activity.id}`}
                copy={String(activity.id)}
                valueClassName="font-mono text-xs font-normal"
              />
              <Field
                label="Raw Timestamp"
                value={activity.createdAt}
                copy={activity.createdAt}
                valueClassName="font-mono text-xs font-normal"
              />
            </div>
          </DetailPanel>
        </div>
      </div>
    </div>
  );
}
