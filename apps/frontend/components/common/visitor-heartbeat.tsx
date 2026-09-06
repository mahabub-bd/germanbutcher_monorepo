"use client";

import { getToken } from "@/actions/auth";
import { apiUrl } from "@/utils/api-utils";
import { useEffect } from "react";

const VISITOR_ID_KEY = "gb_visitor_id";
const HEARTBEAT_INTERVAL_MS = 60 * 1000;

function getVisitorId(): string {
  try {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
      visitorId =
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `v-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }
    return visitorId;
  } catch {
    // Storage can be blocked (private browsing) - fall back to a per-load ID
    return `v-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}

export function VisitorHeartbeat() {
  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        const token = await getToken();
        await fetch(`${apiUrl}/online-users/heartbeat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            visitorId: getVisitorId(),
            page: window.location.pathname,
          }),
          keepalive: true,
        });
      } catch {
        // Fire-and-forget: never surface heartbeat failures to the user
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        sendHeartbeat();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
