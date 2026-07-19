"use client";

import { useContext } from "react";
import { NotificationContext } from "@/contexts/notification-context";

export function useNotification() {
  const context = useContext(NotificationContext);

  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }

  return context;
}
