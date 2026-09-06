"use client";

import { useOnlineUsers } from "@/components/admin/analytics/use-online-users";
import StatsCard from "@/components/admin/dashboard/stats-card";
import { Users } from "lucide-react";

export function PulseDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
    </span>
  );
}

export function OnlineNowCard() {
  const { data, isLoading } = useOnlineUsers();

  const description = data
    ? `${data.authenticated} logged in · ${data.guests} guests`
    : isLoading
      ? "Loading…"
      : "Unavailable";

  return (
    <StatsCard
      icon={Users}
      title="Online Now"
      value={data ? data.total : "--"}
      description={description}
      badge={{ icon: PulseDot, text: "LIVE", color: "success" }}
      bgColor="green"
    />
  );
}
