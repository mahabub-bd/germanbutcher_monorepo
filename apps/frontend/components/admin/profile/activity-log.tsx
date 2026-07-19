"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { fetchDataPagination } from "@/utils/api-utils";
import type { UserActivity } from "@/utils/types";
import {
  Check,
  LogIn,
  Settings,
  ShoppingCart,
  AlertTriangle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";

export function ActivityLog() {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const response = await fetchDataPagination<{
        data: UserActivity[];
      }>(`user-activities?limit=5`);
      setActivities(response.data);
    } catch (error) {
      console.error("Error fetching user activities:", error);
      toast.error("Failed to load activity log. Please try again.");
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const getHttpMethodColor = (action: string) => {
    const method = action.split(' ')[0].toUpperCase();
    switch (method) {
      case "GET":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "POST":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "PATCH":
      case "PUT":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "DELETE":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getActionIcon = (action: string) => {
    const method = action.split(' ')[0].toUpperCase();
    switch (method) {
      case "GET":
        return <Check className="h-4 w-4" />;
      case "POST":
        return <ShoppingCart className="h-4 w-4" />;
      case "PATCH":
      case "PUT":
        return <Settings className="h-4 w-4" />;
      case "DELETE":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <LogIn className="h-4 w-4" />;
    }
  };

  const formatAction = (action: string) => {
    const parts = action.split(' ');
    if (parts.length >= 2) {
      return parts.slice(1).join(' ').replace(/\/v1\//, '').replace(/:id/g, '');
    }
    return action;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <CardDescription>Recent activity on your account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <LoadingIndicator message="Loading activity..." />
        ) : activities.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            No recent activity found
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4">
                <div
                  className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${getHttpMethodColor(
                    activity.action
                  )}`}
                >
                  {getActionIcon(activity.action)}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    {activity.message || formatAction(activity.action)}
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span>{formatDateTime(activity.createdAt)}</span>
                    <span className="mx-2">•</span>
                    <span className="uppercase">{activity.entityType}</span>
                    {activity.entityId && (
                      <>
                        <span className="mx-2">•</span>
                        <span>ID: {activity.entityId}</span>
                      </>
                    )}
                    <span className="mx-2">•</span>
                    <span>{activity.ipAddress}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <Button variant="outline" className="w-full">
          View All Activity
        </Button>
      </CardContent>
    </Card>
  );
}
