"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <div>
            <CardTitle className="text-lg">
              Send Maintenance Notification
            </CardTitle>
            <CardDescription className="text-xs">
              Notify users about system maintenance
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Connection Status */}
        <div className="flex items-center gap-2 text-xs">
          <div
            className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
          />
          <span className={isConnected ? "text-green-600" : "text-red-600"}>
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        {/* Form Fields */}
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="title" className="text-xs">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Scheduled Maintenance"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="message" className="text-xs">
              Message <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="message"
              placeholder="We'll be performing system maintenance. Services may be temporarily unavailable."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={300}
              className="text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1 w-full">
              <Label htmlFor="severity" className="text-xs">
                Severity
              </Label>
              <Select
                value={severity}
                onValueChange={(value: any) => setSeverity(value)}
              >
                <SelectTrigger className="h-8 text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info" className="text-xs">
                    Info
                  </SelectItem>
                  <SelectItem value="warning" className="text-xs">
                    Warning
                  </SelectItem>
                  <SelectItem value="critical" className="text-xs">
                    Critical
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 w-full">
              <Label className="text-xs">Scheduled Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-8 w-full justify-start text-left font-normal text-xs"
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
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

            <div className="space-y-1 w-full">
              <Label htmlFor="time" className="text-xs">
                Time
              </Label>
              <TimePicker
                value={scheduledTime}
                onChange={setScheduledTime}
                placeholder="Select time"
              />
            </div>
            <div className="space-y-1 w-full">
              <Label htmlFor="duration" className="text-xs">
                Duration
              </Label>
              <Input
                id="duration"
                placeholder="e.g., 2 hours, 30 minutes"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                maxLength={30}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        {(title || message) && (
          <div className={`border rounded p-2 space-y-1 ${getSeverityColor()}`}>
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              <p className="text-[10px] font-semibold uppercase">Preview</p>
            </div>
            {title && <p className="font-semibold text-sm">{title}</p>}
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
        <div className="flex gap-2 pt-2 justify-end">
          <Button
            onClick={handleClear}
            variant="outline"
            disabled={isLoading}
            size="sm"
            className="h-8 px-5"
          >
            <span className="text-xs">Clear</span>
          </Button>
          <Button
            onClick={handleSendMaintenance}
            disabled={
              isLoading || !isConnected || !title.trim() || !message.trim()
            }
            className="inline-flex h-8 px-5"
            size="sm"
            variant={severity === "critical" ? "destructive" : "default"}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                <span className="text-xs">Sending...</span>
              </>
            ) : (
              <>
                <Send className="mr-1.5 h-3 w-3" />
                <span className="text-xs">Send</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
