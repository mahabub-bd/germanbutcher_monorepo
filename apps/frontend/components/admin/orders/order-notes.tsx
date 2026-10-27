"use client";

import { Calendar, Clock, StickyNote } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { postData } from "@/utils/api-utils";
import { getOrderStatusColor, getStatusIcon } from "@/utils/order-helper";
import { toast } from "sonner";
import type { Order, OrderNote } from "@/utils/types";

// Note timestamps render as separate date / time chips, so format them
// individually — same Dhaka timezone as formatDateTime.
const NOTE_TZ = "Asia/Dhaka";
const noteDate = (ts: string) =>
  new Date(ts).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: NOTE_TZ,
  });
const noteTime = (ts: string) =>
  new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: NOTE_TZ,
  });

interface OrderNotesProps {
  order: Order;
  /** Tighter list rows for dense pages like the order details view. */
  compact?: boolean;
  /** Keeps the list in sync after a note is added (e.g. modal parent state). */
  onNotesChange?: (notes: OrderNote[]) => void;
}

export function OrderNotes({ order, compact, onNotesChange }: OrderNotesProps) {
  const [notes, setNotes] = useState<OrderNote[]>(order.notes ?? []);
  const [draft, setDraft] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNote = async () => {
    const text = draft.trim();
    if (!text) return;

    setIsSubmitting(true);
    try {
      const response = await postData<OrderNote>(`orders/${order.id}/notes`, {
        note: text,
      });
      if (!response.data) throw new Error("Failed to add note");
      const next = [...notes, response.data];
      setNotes(next);
      onNotesChange?.(next);
      setDraft("");
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error adding order note:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add note"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Card header mirrors OrderTimeline's so the two sit side by side with
    // identical title typography (text-base font-semibold + icon chip).
    <section className="overflow-hidden rounded-sm border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <span className="rounded-md bg-primary/10 p-1 text-primary">
            <StickyNote className="h-3.5 w-3.5" />
          </span>
          Order Notes
        </h3>
        <Button
          type="button"
          size="sm"
          onClick={() => setIsDialogOpen(true)}
          className="gap-1 bg-primaryColor text-primary-foreground hover:bg-primaryColor/90"
        >
          Add Note
        </Button>
      </div>
      <div className={compact ? "p-3" : "p-4"}>
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No notes yet. Use “Add Note” to record customer calls, delivery
          instructions, etc.
        </p>
      ) : (
        <ul className={compact ? "space-y-2.5" : "space-y-3"}>
          {notes.map((item) => (
            <li key={item.id} className="flex gap-2.5">
              <span
                aria-hidden
                className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primaryColor/10 text-xs font-semibold text-primaryColor"
              >
                {(item.createdBy?.name || "S").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                {/* Meta line: author + date on the left, status pinned right */}
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {item.createdBy?.name || "System"}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="size-3" />
                      {noteDate(item.createdAt)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {noteTime(item.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-muted-foreground">
                      Order Status:
                    </span>
                    <Badge
                      className={`${getOrderStatusColor(item.orderStatus)} px-2 py-0.5 text-[11px] font-medium capitalize`}
                    >
                      <span className="mr-1">
                        {getStatusIcon(item.orderStatus)}
                      </span>
                      {item.orderStatus}
                    </Badge>
                  </div>
                </div>
                {/* Note on the second line */}
                <p className="text-sm">
                  <span className="font-medium text-muted-foreground">
                    Note:{" "}
                  </span>
                  <span className="whitespace-pre-wrap">{item.note}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add Note dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Order Note</DialogTitle>
            <DialogDescription>
              Note for order #{order.orderNo} — the current order status is
              saved with it.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. Customer called — deliver after 5pm"
            className="min-h-24"
            autoFocus
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddNote}
              disabled={isSubmitting || !draft.trim()}
              className="bg-primaryColor text-primary-foreground hover:bg-primaryColor/90"
            >
              {isSubmitting ? "Adding..." : "Add Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </section>
  );
}
