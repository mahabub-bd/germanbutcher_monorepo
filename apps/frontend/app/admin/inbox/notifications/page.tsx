"use client";

import { SendMaintenanceNotification } from "@/components/admin/notifications/send-maintenance-notification";
import { SendOfferNotification } from "@/components/admin/notifications/send-offer-notification";
import { Button } from "@/components/ui/button";
import { Bell, Megaphone, Wrench } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

const BROADCAST_TABS = [
  {
    value: "offers",
    label: "Offers & Promotions",
    icon: <Megaphone className="size-3.5 sm:size-4" />,
    colors: "bg-blue-50 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70",
    activeColors: "bg-blue-600 text-white hover:bg-blue-600 dark:bg-blue-400 dark:text-blue-950 dark:hover:bg-blue-400",
  },
  {
    value: "maintenance",
    label: "Maintenance",
    icon: <Wrench className="size-3.5 sm:size-4" />,
    colors: "bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70",
    activeColors: "bg-amber-500 text-white hover:bg-amber-500 dark:bg-amber-400 dark:text-amber-950 dark:hover:bg-amber-400",
  },
];

export default function NotificationsPage() {
  const [tab, setTab] = useState("offers");

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

      {/* Pill tabs — same design as the inbox ticket status tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-4 sm:gap-2">
        {BROADCAST_TABS.map((t) => {
          const active = tab === t.value;
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950 sm:px-4 sm:py-2 sm:text-sm ${active ? t.activeColors : t.colors}`}
            >
              {t.icon}
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {tab === "offers" ? (
          <SendOfferNotification />
        ) : (
          <SendMaintenanceNotification />
        )}
      </div>
    </AdminPageContainer>
  );
}
