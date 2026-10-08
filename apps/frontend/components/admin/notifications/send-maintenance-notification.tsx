"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { SectionCard } from "@/components/admin/products/form/section-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TimePicker } from "@/components/ui/time-picker";
import { useNotification } from "@/hooks/use-notification";
import { format } from "date-fns";
import { AlertTriangle, CalendarIcon, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function SendMaintenanceNotification() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<"info" | "warning" | "critical">(
    "info"
  );
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState("");
  const [duration, setDuration] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { socket, isConnected } = useNotification();

  const handleSendMaintenance = async () => {
    // Validation
    if (!title.trim()) {
      toast.error("Please enter a maintenance title");
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter a maintenance message");
      return;
    }

    if (!socket || !isConnected) {
      toast.error(
        "Not connected to notification server. Please refresh the page."
      );
      return;
    }

    setIsLoading(true);

    // Set up one-time listeners for this broadcast
    const successHandler = (response: {
      success: boolean;
      recipientCount: number;
    }) => {
      toast.success("Maintenance notification sent successfully!", {
        description: `Sent to ${response.recipientCount} connected user${response.recipientCount !== 1 ? "s" : ""}`,
        duration: 5000,
      });

      // Clear form
      setTitle("");
      setMessage("");
      setSeverity("info");
      setScheduledDate(undefined);
      setScheduledTime("");
      setDuration("");
      setIsLoading(false);
    };

    const errorHandler = (error: { message: string }) => {
      console.error("Error sending maintenance notification:", error);
      toast.error("Failed to send maintenance notification", {
        description: error.message || "Please try again",
        duration: 5000,
      });
      setIsLoading(false);
    };

    // Listen for response (only once)
    socket.once("broadcastSent", successHandler);
    socket.once("error", errorHandler);

    try {
      // Format the scheduled datetime
      let scheduledDateTime = undefined;
      if (scheduledDate || scheduledTime) {
        const dateStr = scheduledDate
          ? format(scheduledDate, "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd");
        const timeStr = scheduledTime || "00:00";
        scheduledDateTime = `${dateStr} ${timeStr}`;
      }

      // Send via WebSocket
      socket.emit("sendBroadcast", {
        data: {
          title: title,
          message: message,
          severity: severity,
          scheduledTime: scheduledDateTime,
          duration: duration || undefined,
          type: "maintenance",
        },
      });

      // Set a timeout in case no response is received
      setTimeout(() => {
        socket.off("broadcastSent", successHandler);
        socket.off("error", errorHandler);
        if (isLoading) {
          toast.warning("Notification sent, but no confirmation received", {
            description: "Please check if users received the notification",
            duration: 5000,
          });
          setIsLoading(false);
        }
      }, 10000); // 10 second timeout
    } catch (error) {
      console.error("Error sending maintenance notification:", error);
      socket.off("broadcastSent", successHandler);
      socket.off("error", errorHandler);
      toast.error("Failed to send maintenance notification");
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setTitle("");
    setMessage("");
    setSeverity("info");
    setScheduledDate(undefined);
    setScheduledTime("");
    setDuration("");
  };

  const getSeverityColor = () => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50";
      case "warning":
        return "text-orange-600 bg-orange-50";
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  return (
    <SectionCard
      icon={AlertTriangle}
      title="Send Maintenance Notification"
      subtitle="Notify users about system maintenance"
    >
      {/* Connection Status */}
      <div className="flex items-center gap-2 text-xs">
        <div
          className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
        />
        <span className={isConnected ? "text-green-600" : "text-red-600"}>
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            placeholder="Scheduled Maintenance"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="message">
            Message <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="message"
            placeholder="We'll be performing system maintenance. Services may be temporarily unavailable."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={300}
            className="resize-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Severity</Label>
            <Select
              value={severity}
              onValueChange={(value: any) => setSeverity(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Scheduled Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {scheduledDate ? (
                    format(scheduledDate, "MMM dd, yyyy")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={scheduledDate}
                  onSelect={setScheduledDate}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="time">Time</Label>
            <TimePicker
              value={scheduledTime}
              onChange={setScheduledTime}
              placeholder="Select time"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              placeholder="e.g., 2 hours, 30 minutes"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              maxLength={30}
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      {(title || message) && (
        <div className={`rounded-lg border p-3 space-y-1 ${getSeverityColor()}`}>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            <p className="text-[10px] font-semibold uppercase">Preview</p>
          </div>
          {title && <p className="text-sm font-semibold">{title}</p>}
          {message && <p className="text-xs opacity-90">{message}</p>}
          <div className="flex flex-wrap gap-2 text-xs">
            {scheduledDate && (
              <span>📅 {format(scheduledDate, "MMM dd, yyyy")}</span>
            )}
            {scheduledTime && <span>🕐 {scheduledTime}</span>}
            {duration && <span>⏱️ {duration}</span>}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <Button onClick={handleClear} variant="outline" disabled={isLoading}>
          Clear
        </Button>
        <Button
          onClick={handleSendMaintenance}
          disabled={
            isLoading || !isConnected || !title.trim() || !message.trim()
          }
          variant={severity === "critical" ? "destructive" : "default"}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send
            </>
          )}
        </Button>
      </div>
    </SectionCard>
  );
}
