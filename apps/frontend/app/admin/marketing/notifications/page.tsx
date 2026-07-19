"use client";

import { SendOfferNotification } from "@/components/admin/notifications/send-offer-notification";
import { SendMaintenanceNotification } from "@/components/admin/notifications/send-maintenance-notification";
import { Button } from "@/components/ui/button";
import { CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell } from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
  return (
    <div className="space-y-6 border rounded-sm">
      <div className="md:p-4 p-2">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">Broadcast Notifications</CardTitle>
              <CardDescription>
                Send offers, announcements, and system updates to your customers
              </CardDescription>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/marketing/coupon/coupon-list">
              Back to Marketing
            </Link>
          </Button>
        </div>
      </div>

      <div className="md:p-4 p-2">
        <Tabs defaultValue="offers" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="offers">Offers & Promotions</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="offers">
            <SendOfferNotification />
          </TabsContent>

          <TabsContent value="maintenance">
            <SendMaintenanceNotification />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
