"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNotification } from "@/hooks/use-notification";
import { Loader2, Megaphone, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function SendOfferNotification() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [discount, setDiscount] = useState("");
  const [offerId, setOfferId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { socket, isConnected } = useNotification();

  const handleSendOffer = async () => {
    // Validation
    if (!title.trim()) {
      toast.error("Please enter an offer title");
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter an offer message");
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
      toast.success("Offer notification sent successfully!", {
        description: `Sent to ${response.recipientCount} connected user${response.recipientCount !== 1 ? "s" : ""}`,
        duration: 5000,
      });

      // Clear form
      setTitle("");
      setMessage("");
      setDiscount("");
      setOfferId("");
      setIsLoading(false);
    };

    const errorHandler = (error: { message: string }) => {
      console.error("Error sending offer notification:", error);
      toast.error("Failed to send offer notification", {
        description: error.message || "Please try again",
        duration: 5000,
      });
      setIsLoading(false);
    };

    // Listen for response (only once)
    socket.once("broadcastSent", successHandler);
    socket.once("error", errorHandler);

    try {
      // Send via WebSocket
      socket.emit("sendBroadcast", {
        data: {
          title: title,
          message: message,
          discount: discount || undefined,
          offerId: offerId || undefined,
          type: "offer",
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
      console.error("Error sending offer notification:", error);
      socket.off("broadcastSent", successHandler);
      socket.off("error", errorHandler);
      toast.error("Failed to send offer notification");
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setTitle("");
    setMessage("");
    setDiscount("");
    setOfferId("");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg">Send Offer Notification</CardTitle>
            <CardDescription className="text-xs">
              Broadcast to all connected customers
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
              placeholder="Weekend Sale, Flash Offer"
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
              placeholder="Get 50% off this weekend only!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={300}
              className="text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="discount" className="text-xs">
                Discount
              </Label>
              <Input
                id="discount"
                placeholder="50%"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                maxLength={50}
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="offerId" className="text-xs">
                Code
              </Label>
              <Input
                id="offerId"
                placeholder="WEEKEND2026"
                value={offerId}
                onChange={(e) => setOfferId(e.target.value.toUpperCase())}
                maxLength={20}
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        {(title || message) && (
          <div className="border rounded p-2 bg-muted/50 space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">
              Preview
            </p>
            {title && <p className="font-semibold text-sm">{title}</p>}
            {message && (
              <p className="text-xs text-muted-foreground">{message}</p>
            )}
            <div className="flex gap-2 text-xs">
              {discount && (
                <span className="text-primary font-medium">{discount}</span>
              )}
              {offerId && (
                <span className="text-muted-foreground">Code: {offerId}</span>
              )}
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
            className="h-8 px-3 inline-flex"
          >
            <span className="text-xs">Clear</span>
          </Button>
          <Button
            onClick={handleSendOffer}
            disabled={
              isLoading || !isConnected || !title.trim() || !message.trim()
            }
            className="inline-flex h-8"
            size="sm"
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
