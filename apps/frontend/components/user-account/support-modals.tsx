"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/utils";
import { fetchProtectedData, postData } from "@/utils/api-utils";
import type {
  ContactMessage,
  ContactMessageReply,
  Order,
} from "@/utils/types";
import { CheckCheck, Loader2, Package, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

/** Order info the support form needs for its reference picker. */
export interface SupportOrder {
  orderNo: string;
  createdAt: string;
  orderStatus: Order["orderStatus"];
}

export const SUPPORT_STATUS_BADGES: Record<
  ContactMessage["contactStatus"],
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "rounded-full bg-yellow-100 text-yellow-700",
  },
  in_progress: {
    label: "In Progress",
    className: "rounded-full bg-blue-100 text-blue-700",
  },
  resolved: {
    label: "Resolved",
    className: "rounded-full bg-green-100 text-green-700",
  },
  closed: {
    label: "Closed",
    className: "rounded-full bg-gray-100 text-gray-600",
  },
};

export interface CreateTicketPayload {
  name: string;
  email: string;
  mobile: string;
  message: string;
  orderReference?: string;
}

/** "ORD123456 . 30 Oct 2026" - the picker's label for one order. */
const orderOptionLabel = (order: SupportOrder) => {
  const date = new Date(order.createdAt).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const status = order.orderStatus === "delivered" ? " . delivered" : "";
  return `${order.orderNo} . ${date}${status}`;
};

/** Modal for a customer to open a new support ticket. */
export function CreateTicketModal({
  open,
  onClose,
  user,
  orders,
  onSubmitMessage,
}: {
  open: boolean;
  onClose: () => void;
  user: { name?: string; email?: string; mobileNumber?: string };
  orders: SupportOrder[];
  onSubmitMessage: (payload: CreateTicketPayload) => Promise<void>;
}) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [mobile, setMobile] = useState(user?.mobileNumber || "");
  const [message, setMessage] = useState("");
  const [orderReference, setOrderReference] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fresh (mostly-empty) form every time the modal opens.
  useEffect(() => {
    if (open) {
      setName(user?.name || "");
      setEmail(user?.email || "");
      setMobile(user?.mobileNumber || "");
      setMessage("");
      setOrderReference("");
    }
  }, [open, user]);

  const handleSubmit = async () => {
    if (name.trim().length < 2) {
      toast.error("Please enter your name");
      return;
    }
    if (message.trim().length < 10) {
      toast.error("Message must be at least 10 characters");
      return;
    }
    if (message.trim().length > 1000) {
      toast.error("Message must be at most 1000 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitMessage({
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        message: message.trim(),
        ...(orderReference ? { orderReference } : {}),
      });
      toast.success("Message sent - we'll get back to you soon");
      onClose();
} catch {
      toast.error("Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="@container max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Support Message</DialogTitle>
          <DialogDescription>
            Tell us what went wrong and we&apos;ll get back to you by email.
          </DialogDescription>
        </DialogHeader>

        {/* Columns follow the modal's own width (@container), not the viewport,
            so the fields stay on one row even in a narrow browser pane. */}
        <div className="grid grid-cols-1 gap-4 @[30rem]:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="support-name">Name</Label>
            <Input
              id="support-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="support-email">Email</Label>
            <Input
              id="support-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="support-mobile">Mobile</Label>
            <Input
              id="support-mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="+8801XXXXXXXXX"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="support-order-reference">
            Order reference{" "}
            <span className="text-xs font-normal text-gray-400">
              (optional)
            </span>
          </Label>
          <div className="relative">
            <Package className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select
              id="support-order-reference"
              value={orderReference}
              onChange={(e) => setOrderReference(e.target.value)}
              className="h-9 w-full appearance-none rounded-md border border-gray-200 bg-white pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No specific order</option>
              {orders.map((order) => (
                <option key={order.orderNo} value={order.orderNo}>
                  {orderOptionLabel(order)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="support-message">Message</Label>
          <Textarea
            id="support-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your issue (10-1000 characters)"
            rows={4}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-lg px-5 font-semibold"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Send Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
