"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { CalendarClock, CheckCircle2, Circle, Trash2 } from "lucide-react";

/** CRM follow-up activity (note/task/call/email) from the 360 payload. */
export interface CustomerActivityRow {
    id: number;
    type: "note" | "task" | "call" | "email";
    title: string;
    description: string | null;
    dueDate: string | null;
    status: "open" | "completed";
    completedAt: string | null;
    createdAt: string;
    createdBy?: { id: number; name: string } | null;
}

interface CustomerActivitiesPanelProps {
    activities: CustomerActivityRow[];
    canEdit: boolean;
    canDelete: boolean;
    onToggleComplete: (activity: CustomerActivityRow) => void;
    onDelete: (activity: CustomerActivityRow) => void;
}

/**
 * Activities tab shared by the admin customer detail and CRM 360 pages:
 * follow-up cards with complete/reopen and delete actions gated by the
 * CRM menu permissions passed in by the caller.
 */
export function CustomerActivitiesPanel({
    activities,
    canEdit,
    canDelete,
    onToggleComplete,
    onDelete,
}: CustomerActivitiesPanelProps) {
    if (activities.length === 0) {
        return (
            <p className="text-sm text-muted-foreground py-6 text-center">
                No activities yet. Use &quot;Add Activity&quot; to record a note or task.
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {activities.map((activity) => (
                <div
                    key={activity.id}
                    className="rounded-lg border bg-card p-4 flex items-start justify-between gap-3"
                >
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="capitalize">
                                {activity.type}
                            </Badge>
                            <span
                                className={`text-sm font-medium ${activity.status === "completed"
                                    ? "line-through text-muted-foreground"
                                    : ""
                                    }`}
                            >
                                {activity.title}
                            </span>
                        </div>
                        {activity.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {activity.description}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                            <span>{formatDateTime(activity.createdAt)}</span>
                            {activity.createdBy?.name && (
                                <span>by {activity.createdBy.name}</span>
                            )}
                            {activity.dueDate && activity.status === "open" && (
                                <span className="flex items-center gap-1">
                                    <CalendarClock className="h-3 w-3" />
                                    due {formatDateTime(activity.dueDate)}
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={!canEdit}
                            onClick={() => onToggleComplete(activity)}
                            aria-label={
                                activity.status === "open"
                                    ? "Mark completed"
                                    : "Reopen"
                            }
                        >
                            {activity.status === "open" ? (
                                <Circle className="h-4 w-4" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={!canDelete}
                            onClick={() => onDelete(activity)}
                            aria-label="Delete activity"
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}
