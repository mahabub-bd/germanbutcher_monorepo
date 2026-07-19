"use client";

import { getUser } from "@/actions/auth";
import { NotificationContext } from "@/contexts/notification-context";
import { playNotificationSound } from "@/lib/notification-sound";
import { Notification, OrderStatus } from "@/utils/types";
import { useCallback, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    let newSocket: Socket | null = null;

    const initializeSocket = async () => {
      // Get the current user
      const user = await getUser();

      if (!user) {
        console.log("No user found, skipping WebSocket connection");
        return;
      }

      const socketUrl =
        process.env.NEXT_PUBLIC_SOCKET_URL || "https://api.germanbutcherbd.com";

      // Connect to WebSocket
      newSocket = io(`${socketUrl}/notifications`, {
        query: {
          userId: user.id.toString(),
          isAdmin: user.isAdmin ? "true" : "false",
        },
        transports: ["websocket"],
        withCredentials: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      // Connection handlers
      newSocket.on("connect", () => {
        console.log(
          "✅ [WebSocket] Connected to notification server",
          newSocket?.id
        );
        setIsConnected(true);
      });

      newSocket.on("disconnect", (reason) => {
        console.log(
          "❌ [WebSocket] Disconnected from notification server:",
          reason
        );
        setIsConnected(false);
      });

      newSocket.on("connect_error", (error) => {
        console.error("⚠️ [WebSocket] Connection error:", error);
        setIsConnected(false);
      });

      // Log all outgoing messages
      const originalEmit = newSocket.emit.bind(newSocket);
      newSocket.emit = function (event: string, ...args: any[]) {
        console.log("📤 [WebSocket] Sending:", event, args);
        return originalEmit(event, ...args);
      };

      // Log all incoming messages
      newSocket.onAny((event: string, ...args: any[]) => {
        console.log("📥 [WebSocket] Received:", event, args);
      });

      // Admin-only: Listen for new orders
      if (user.isAdmin) {
        newSocket.on("newOrder", (data: Notification) => {
          console.log("New order received:", data);
          setNotifications((prev) => [data, ...prev]);
          playNotificationSound();

          toast.success("New Order Received!", {
            description: `Order ${data.data.orderNo} - ${data.data.user?.name || "Customer"}`,
            duration: 5000,
          });
        });
      }

      // Listen for order confirmation
      newSocket.on("orderConfirmation", (data: Notification) => {
        console.log("Order confirmed:", data);
        setNotifications((prev) => [data, ...prev]);

        toast.success("Order Confirmed!", {
          description: `Your order ${data.data.orderNo} has been confirmed`,
          duration: 5000,
        });
      });

      // Listen for order status updates
      newSocket.on("orderStatusUpdate", (data: Notification) => {
        console.log("Order status updated:", data);
        setNotifications((prev) => [data, ...prev]);

        const statusMessages: Record<string, string> = {
          [OrderStatus.PENDING]: "is pending",
          [OrderStatus.PROCESSING]: "is being processed",
          [OrderStatus.SHIPPED]: "has been shipped",
          [OrderStatus.DELIVERED]: "has been delivered",
          [OrderStatus.CANCELLED]: "has been cancelled",
        };

        const statusMessage =
          statusMessages[data.data.orderStatus as OrderStatus] ||
          `status updated to ${data.data.orderStatus}`;

        toast.info("Order Status Update", {
          description: `Order ${data.data.orderNo} ${statusMessage}`,
          duration: 5000,
        });
      });

      // Listen for payment status updates
      newSocket.on("paymentStatusUpdate", (data: Notification) => {
        console.log("Payment status updated:", data);
        setNotifications((prev) => [data, ...prev]);

        toast.info("Payment Status Update", {
          description: `Payment for order ${data.data.orderNo}: ${data.data.paymentStatus}`,
          duration: 5000,
        });
      });

      // Listen for general notifications
      newSocket.on("notification", (data: Notification) => {
        console.log("Notification received:", data);
        setNotifications((prev) => [data, ...prev]);

        toast(data.data.title || "Notification", {
          description: data.data.message,
          duration: 5000,
        });
      });

      // Listen for broadcasts
      newSocket.on("broadcast", (data: Notification) => {
        console.log("Broadcast received:", data);
        setNotifications((prev) => [data, ...prev]);

        // Handle different broadcast types
        if (data.data.type === "maintenance") {
          const severity = data.data.severity || "info";
          const toastType =
            severity === "critical"
              ? "error"
              : severity === "warning"
                ? "warning"
                : "info";

          toast[toastType](data.data.title || "System Maintenance", {
            description: data.data.message,
            duration: 10000, // Longer duration for maintenance
          });
        } else {
          // Offer or general broadcast
          toast.info(data.data.title || "System Notification", {
            description: data.data.message,
            duration: 7000,
          });
        }
      });

      setSocket(newSocket);
    };

    initializeSocket();

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [isMounted]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((index: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        socket,
        notifications,
        isConnected,
        clearNotifications,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
