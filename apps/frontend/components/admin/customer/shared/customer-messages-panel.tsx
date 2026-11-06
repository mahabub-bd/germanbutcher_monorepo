"use client";

import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { Mail } from "lucide-react";

/** Contact-message line from the CRM 360 / users extras payload. */
export interface CustomerMessageRow {
    id: number;
    name: string;
    email: string;
    message: string;
    contactStatus: string;
    createdAt: string;
}

/**
 * Messages tab shared by the admin customer detail and CRM 360 pages:
 * one bordered card per contact message with sender, status pill and date.
 */
export function CustomerMessagesPanel({
    messages,
}: {
    messages: CustomerMessageRow[];
}) {
    if (messages.length === 0) {
        return (
            <p className="text-sm text-muted-foreground py-6 text-center">
                No messages yet.
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {messages.map((message) => (
                <div key={message.id} className="rounded-lg border bg-card p-4">
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm font-medium">
                            <Mail className="h-4 w-4" /> {message.email}
                        </span>
                        <Badge variant="outline" className="capitalize">
                            {message.contactStatus.replace(/_/g, " ")}
                        </Badge>
                    </div>
                    <p className="text-sm mt-2">{message.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(message.createdAt)}
                    </p>
                </div>
            ))}
        </div>
    );
}
