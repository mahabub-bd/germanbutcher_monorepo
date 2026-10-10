"use client";

import { AccountPageHeader } from "@/components/user-account/account-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaginationComponent } from "@/components/common/pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/utils";
import { ContactMessage, PaginatedEnvelope } from "@/utils/types";
import { LifeBuoy, Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface MySupportProps {
  messagesData: PaginatedEnvelope<ContactMessage>;
  user: { name?: string; email?: string };
  userId: string;
  currentPage: number;
  onSubmitMessage: (payload: {
    name: string;
    email: string;
    mobile: string;
    message: string;
  }) => Promise<void>;
}

const STATUS_BADGES: Record<
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

const MySupport = ({
  messagesData,
  user,
  currentPage,
  onSubmitMessage,
}: MySupportProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [mobile, setMobile] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messages = messagesData?.data ?? [];
  const totalMessages = messagesData?.total ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      });
      toast.success("Message sent — we'll get back to you soon");
      setMessage("");
      setIsFormOpen(false);
    } catch {
      toast.error("Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <AccountPageHeader
        title="Support"
        icon={<LifeBuoy className="h-5 w-5" />}
        subtitle={`${totalMessages} ${
          totalMessages === 1 ? "message" : "messages"
        }`}
        action={
          <Button
            onClick={() => setIsFormOpen((open) => !open)}
            className="rounded-lg px-5 py-2.5 font-semibold h-auto"
          >
            {isFormOpen ? (
              <>
                <X className="h-4 w-4" />
                Close
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                New Message
              </>
            )}
          </Button>
        }
      />

      {/* New Message Form */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 space-y-4 rounded-xl border border-gray-200 bg-white p-5"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            <Label htmlFor="support-message">Message</Label>
            <Textarea
              id="support-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue (10–1000 characters)"
              rows={4}
            />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Send Message
          </Button>
        </form>
      )}

      {/* Messages List */}
      {messages.length === 0 && !isFormOpen ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <LifeBuoy className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            No support messages yet
          </h2>
          <p className="mb-6 text-gray-600">
            Send us a message and we'll get back to you.
          </p>
          <Button onClick={() => setIsFormOpen(true)}>New Message</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => {
            const badge = STATUS_BADGES[msg.contactStatus] ?? {
              label: msg.contactStatus,
              className: "rounded-full bg-gray-100 text-gray-600",
            };
            return (
              <div
                key={msg.id}
                className="rounded-xl border border-gray-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 text-sm leading-relaxed text-gray-700">
                    {msg.message}
                  </p>
                  <Badge className={badge.className}>{badge.label}</Badge>
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  {formatDateTime(msg.createdAt)}
                </p>
                {msg.responseNotes && (
                  <div className="mt-3 rounded-lg bg-green-50 p-3">
                    <p className="text-xs font-semibold text-green-700">
                      Response from support
                    </p>
                    <p className="mt-1 text-sm text-green-800">
                      {msg.responseNotes}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {messagesData.totalPages > 1 && (
            <PaginationComponent
              currentPage={currentPage}
              totalPages={messagesData.totalPages}
              baseUrl="?page="
            />
          )}
        </div>
      )}
    </div>
  );
};

export default MySupport;
