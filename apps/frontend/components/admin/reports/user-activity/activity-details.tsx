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
  User
} from "lucide-react";

import { useRouter } from "next/navigation";
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
  copy
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
    <div className="flex items-start justify-between gap-3">

      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="font-medium text-sm break-all">{value}</div>
      </div>

      {copy && (
        <Button
          variant="ghost"
          size="icon"
          onClick={copyValue}
        >
          <Copy className="h-4 w-4" />
        </Button>
      )}

    </div>
  );
}



function JsonViewer({ data }: { data: any }) {

  if (!data) {
    return (
      <span className="text-muted-foreground italic text-sm">
        null
      </span>
    );
  }

  return (
    <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}



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

      const response =
        await fetchProtectedData<UserActivity>(
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
  }, [id]);



  /* -----------------------------------------------------
  Helpers
  -----------------------------------------------------*/

  const getHttpMethodColor = (action: string) => {

    const method = action.split(" ")[0].toUpperCase();

    switch (method) {

      case "GET":
        return "bg-blue-100 text-blue-800";

      case "POST":
        return "bg-green-100 text-green-800";

      case "PUT":
      case "PATCH":
        return "bg-yellow-100 text-yellow-800";

      case "DELETE":
        return "bg-red-100 text-red-800";

      default:
        return "bg-gray-100 text-gray-800";
    }

  };



  const getStatusColor = (status: string) => {

    switch (status.toLowerCase()) {

      case "success":
        return "bg-green-100 text-green-800";

      case "failed":
      case "error":
        return "bg-red-100 text-red-800";

      case "pending":
        return "bg-yellow-100 text-yellow-800";

      default:
        return "bg-gray-100 text-gray-800";
    }

  };



  const formatAction = (action: string) => {

    const parts = action.split(" ");

    if (parts.length >= 2) {

      const [method, ...path] = parts;

      return {
        method,
        path: path.join(" ")
      };

    }

    return { method: action, path: "" };

  };



  /* -----------------------------------------------------
  Loading
  -----------------------------------------------------*/

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingIndicator message="Loading activity details..." />
      </div>
    );
  }



  /* -----------------------------------------------------
  Error
  -----------------------------------------------------*/

  if (error || !activity) {

    return (
      <div className="p-6 text-center">

        <Shield className="mx-auto h-16 w-16 text-muted-foreground mb-4" />

        <h2 className="text-xl font-semibold mb-2">
          Activity Not Found
        </h2>

        <p className="text-muted-foreground mb-4">
          {error}
        </p>

        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>

      </div>
    );
  }



  const { method, path } = formatAction(activity.action);



  /* -----------------------------------------------------
  UI
  -----------------------------------------------------*/

  return (

    <div className="space-y-6 w-full p-4">

      {/* Header */}

      <div className="flex items-center gap-4">

        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <PageHeader
          title="Activity Details"
          description="Security audit log event"
        />

      </div>



      {/* Activity Summary */}

      <Card>

        <CardContent className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6">

          <div className="flex items-center gap-3">

            <Badge className={getHttpMethodColor(activity.action)}>
              {method}
            </Badge>

            <code className="text-sm">{path}</code>

          </div>



          <div className="flex flex-wrap gap-6 text-sm">

            <div>

              <p className="text-muted-foreground">Status</p>

              <Badge className={getStatusColor(activity.status)}>
                {activity.status}
              </Badge>

            </div>



            <div>

              <p className="text-muted-foreground">Actor</p>

              <p>{activity.user?.name}</p>

            </div>



            <div>

              <p className="text-muted-foreground">Time</p>

              <p>{formatDateTime(activity.createdAt)}</p>

            </div>

          </div>

        </CardContent>

      </Card>



      {/* Main Layout */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">



        {/* LEFT COLUMN */}

        <div className="lg:col-span-2 space-y-6">



          {/* Action Details */}

          <Card>

            <CardHeader>

              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Action Details
              </CardTitle>

            </CardHeader>

            <CardContent className="space-y-4">

              <InfoRow
                label="Message"
                value={activity.message}
              />

              <InfoRow
                label="Entity Type"
                value={activity.entityType}
              />

              <InfoRow
                label="Entity ID"
                value={activity.entityId || "N/A"}
              />

            </CardContent>

          </Card>



          {/* Data Changes */}

          <Card>

            <CardHeader>

              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Data Changes
              </CardTitle>

            </CardHeader>

            <CardContent className="space-y-6">

              <div>

                <p className="text-sm text-muted-foreground mb-2">
                  Old Value
                </p>

                <JsonViewer data={activity.oldValue} />

              </div>



              <div>

                <p className="text-sm text-muted-foreground mb-2">
                  New Value
                </p>

                <JsonViewer data={activity.newValue} />

              </div>

            </CardContent>

          </Card>

        </div>



        {/* RIGHT COLUMN */}

        <div className="space-y-6">



          {/* User */}

          <Card>

            <CardHeader>

              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User
              </CardTitle>

            </CardHeader>

            <CardContent className="space-y-4">

              <InfoRow
                label="User Name"
                value={activity.user?.name}
              />

              <InfoRow
                label="Email"
                value={activity.user?.email}
              />

              <InfoRow
                label="User ID"
                value={activity.user?.id}
                copy={String(activity.user?.id)}
              />

            </CardContent>

          </Card>



          {/* Request Metadata */}

          <Card>

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

              <InfoRow
                label="User Agent"
                value={activity.userAgent}
              />

            </CardContent>

          </Card>

        </div>

      </div>

    </div>

  );

}