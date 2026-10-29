"use client";

import { SendMaintenanceNotification } from "@/components/admin/notifications/send-maintenance-notification";
import { SendOfferNotification } from "@/components/admin/notifications/send-offer-notification";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell } from "lucide-react";
import Link from "next/link";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function NotificationsPage() {
  return (
    <AdminPageContainer>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Bell className="h-7 w-7 shrink-0" />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">
              Broadcast Notifications
            </h1>
          </div>
        </div>
        <Button asChild variant="outline" className="shrink-0">
          <Link href="/admin/inbox">
            Back to Inbox
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="offers" className="w-full">
        <TabsList className="grid h-11 w-full grid-cols-2 rounded-lg p-1">
          <TabsTrigger value="offers" className="text-sm">
            Offers &amp; Promotions
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="text-sm">
            Maintenance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="offers" className="mt-4">
          <SendOfferNotification />
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4">
          <SendMaintenanceNotification />
        </TabsContent>
      </Tabs>
    </AdminPageContainer>
  );
}
