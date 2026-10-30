"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SearchableSelect,
} from "@/components/ui/searchable-select";
import {
  ContactSource,
} from "@/components/admin/inbox/ticket-shared";
import { fetchDataPagination, postData } from "@/utils/api-utils";
import type { Order } from "@/utils/types";
import { XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const EMPTY_FORM = {
  name: "",
  email: "",
  mobile: "",
  message: "",
  orderReference: "",
  source: ContactSource.PHONE,
};

/** How many recent orders the reference picker loads. */
const ORDER_PICKER_LIMIT = 100;

/** "ORD123456 · John Doe" — the picker's label for one order. */
const orderOptionLabel = (order: Order) => {
  const customer = order.user?.name?.trim() || "";
  return customer ? `${order.orderNo} · ${customer}` : order.orderNo;
};

/** Admin-logged ticket (phone / Facebook / WhatsApp walk-in inquiries). */
export function AddTicketModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isAddingTicket, setIsAddingTicket] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setIsLoadingOrders(true);
    fetchDataPagination<{ data: Order[] }>(
      `orders?page=1&limit=${ORDER_PICKER_LIMIT}&sort=date_desc`
    )
      .then((response) => {
        if (!cancelled) setRecentOrders(response.data ?? []);
      })
      .catch((error) => {
        console.error("Error loading recent orders:", error);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingOrders(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const orderOptions = useMemo(
    () => recentOrders.map(orderOptionLabel),
    [recentOrders]
  );

  if (!open) return null;

  const selectedOrder = recentOrders.find(
    (order) => order.orderNo === form.orderReference
  );

  const handleAddTicket = async () => {
    const { name, email, mobile, message, orderReference, source } = form;
    if (!name.trim() || !email.trim() || !mobile.trim() || !message.trim()) {
      toast.error("All fields are required.");
      return;
    }
    setIsAddingTicket(true);
    try {
      await postData("contact-messages", {
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        message: message.trim(),
        ...(orderReference ? { orderReference } : {}),
        source,
      });
      toast.success("Ticket added.");
      setForm(EMPTY_FORM);
      onClose();
      onAdded();
    } catch (error) {
      console.error("Error adding ticket:", error);
      toast.error("Failed to add ticket.");
    } finally {
      setIsAddingTicket(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4">
      <div className="bg-white dark:bg-neutral-900 sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto max-w-lg max-h-full sm:max-h-[90vh] overflow-y-auto">
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Add Ticket
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Log an inquiry that arrived by phone, Facebook, WhatsApp, etc.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 border border-gray-200 dark:border-neutral-700 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800"
          >
            <XCircle className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Source</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(ContactSource).map((source) => (
                <button
                  key={source}
                  type="button"
                  onClick={() => setForm({ ...form, source })}
                  className={`text-xs py-2 px-2 rounded-md border capitalize ${form.source === source
                    ? "bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-950/40"
                    : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                    }`}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Customer name"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="customer@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Mobile</label>
            <Input
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              placeholder="+8801XXXXXXXXX"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Order reference{" "}
              <span className="text-xs text-gray-400 font-normal">
                (optional)
              </span>
            </label>
            <SearchableSelect
              value={selectedOrder ? orderOptionLabel(selectedOrder) : ""}
              onValueChange={(label) => {
                const selected = recentOrders.find(
                  (order) => orderOptionLabel(order) === label
                );
                setForm({
                  ...form,
                  orderReference: selected ? selected.orderNo : "",
                });
              }}
              options={orderOptions}
              placeholder={
                isLoadingOrders ? "Loading orders..." : "Select an order"
              }
              searchPlaceholder="Search order no. or customer..."
              emptyMessage="No matching recent orders."
              disabled={isLoadingOrders}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Showing the {ORDER_PICKER_LIMIT} most recent orders.
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={4}
              placeholder="What the customer asked..."
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="px-6 py-3 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isAddingTicket}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleAddTicket} disabled={isAddingTicket}>
            {isAddingTicket ? "Saving..." : "Save Ticket"}
          </Button>
        </div>
      </div>
    </div>
  );
}
