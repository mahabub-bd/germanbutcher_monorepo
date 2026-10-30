"use client";

import { ContactSource } from "@/components/admin/inbox/ticket-shared";
import { Facebook } from "@/components/icons/brand-icons";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  fetchDataPagination,
  fetchProtectedData,
  postData,
} from "@/utils/api-utils";
import type { Order, User } from "@/utils/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BadgeCheck,
  Ellipsis,
  Globe,
  Mail,
  MessageCircle,
  Phone,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

/** How many recent orders / search hits the pickers load. */
const PICKER_LIMIT = 100;

/** "ORD123456 · John Doe" — the picker's label for one order. */
const orderOptionLabel = (order: Order) => {
  const customer = order.user?.name?.trim() || "";
  return customer ? `${order.orderNo} · ${customer}` : order.orderNo;
};

/** "John Doe · john@example.com" — the picker's label for one customer. */
const customerOptionLabel = (customer: Pick<User, "name" | "email">) =>
  `${customer.name} · ${customer.email}`;

// Mirrors CreateContactMessageDto on the backend — same limits, same errors.
const ticketSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be longer than or equal to 2 characters.")
    .max(100, "Name must be shorter than or equal to 100 characters."),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Email must be a valid email address.")
    .max(150, "Email must be shorter than or equal to 150 characters."),
  mobile: z
    .string()
    .trim()
    .min(10, "Mobile number must be longer than or equal to 10 characters.")
    .max(20, "Mobile number must be shorter than or equal to 20 characters.")
    .regex(/^[\+]?[0-9\s\-\(\)]+$/, "Mobile number must be valid."),
  message: z
    .string()
    .trim()
    .min(10, "Message must be longer than or equal to 10 characters.")
    .max(
      1000,
      "Message must be shorter than or equal to 1000 characters."
    ),
  orderReference: z.string().max(50).optional(),
  source: z.nativeEnum(ContactSource),
});

type TicketFormData = z.infer<typeof ticketSchema>;

/** Icon + tab-menu-style colour pair per inquiry channel. Facebook uses the
 * local brand icon since lucide-react dropped its brand icons. Colours follow
 * the status tabs on the inbox list page. */
const SOURCE_META: Record<
  ContactSource,
  {
    icon: ComponentType<{ className?: string }>;
    colors: string;
    activeColors: string;
  }
> = {
  [ContactSource.WEBSITE]: {
    icon: Globe,
    colors:
      "bg-violet-50 text-violet-800 hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-950/70",
    activeColors:
      "bg-violet-600 text-white hover:bg-violet-600 dark:bg-violet-400 dark:text-violet-950 dark:hover:bg-violet-400",
  },
  [ContactSource.FACEBOOK]: {
    icon: Facebook,
    colors:
      "bg-blue-50 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70",
    activeColors:
      "bg-blue-600 text-white hover:bg-blue-600 dark:bg-blue-400 dark:text-blue-950 dark:hover:bg-blue-400",
  },
  [ContactSource.PHONE]: {
    icon: Phone,
    colors:
      "bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70",
    activeColors:
      "bg-amber-500 text-white hover:bg-amber-500 dark:bg-amber-400 dark:text-amber-950 dark:hover:bg-amber-400",
  },
  [ContactSource.EMAIL]: {
    icon: Mail,
    colors:
      "bg-sky-50 text-sky-800 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-950/70",
    activeColors:
      "bg-sky-600 text-white hover:bg-sky-600 dark:bg-sky-400 dark:text-sky-950 dark:hover:bg-sky-400",
  },
  [ContactSource.WHATSAPP]: {
    icon: MessageCircle,
    colors:
      "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70",
    activeColors:
      "bg-emerald-600 text-white hover:bg-emerald-600 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-400",
  },
  [ContactSource.OTHER]: {
    icon: Ellipsis,
    colors:
      "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-900",
    activeColors:
      "bg-slate-800 text-white hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-200",
  },
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
  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      name: "",
      email: "",
      mobile: "",
      message: "",
      orderReference: "",
      source: ContactSource.PHONE,
    },
  });
  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting },
  } = form;

  const message = watch("message");
  const orderReference = watch("orderReference");

  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [customers, setCustomers] = useState<User[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [isLoadingCustomerOrders, setIsLoadingCustomerOrders] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setSelectedCustomer(null);
    setCustomerSearch("");
    setShowSuggestions(false);
    setIsLoadingOrders(true);
    fetchDataPagination<{ data: Order[] }>(
      `orders?page=1&limit=${PICKER_LIMIT}&sort=date_desc`
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

  // Customer list is server-paginated, so search it on the API instead of
  // client-side — typing re-queries `users/customers` (debounced). No fetch
  // until something is typed; an empty field means a guest ticket.
  useEffect(() => {
    if (!open) return;
    const term = customerSearch.trim();
    if (!term) {
      setCustomers([]);
      setIsLoadingCustomers(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setIsLoadingCustomers(true);
      const params = new URLSearchParams({
        page: "1",
        limit: String(PICKER_LIMIT),
        sort: "DESC",
        search: term,
      });
      fetchDataPagination<{ data: { customers: User[] } }>(
        `users/customers?${params.toString()}`
      )
        .then((response) => {
          if (!cancelled) setCustomers(response.data.customers ?? []);
        })
        .catch((error) => {
          console.error("Error loading customers:", error);
        })
        .finally(() => {
          if (!cancelled) setIsLoadingCustomers(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, customerSearch]);

  // Load the picked customer's orders so the reference picker lists them.
  useEffect(() => {
    if (!selectedCustomer) {
      setCustomerOrders([]);
      return;
    }
    let cancelled = false;
    setIsLoadingCustomerOrders(true);
    fetchProtectedData<Order[]>(`orders/user/${selectedCustomer.id}`)
      .then((orders) => {
        if (!cancelled) setCustomerOrders(orders ?? []);
      })
      .catch((error) => {
        console.error("Error loading customer orders:", error);
        if (!cancelled) setCustomerOrders([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCustomerOrders(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCustomer]);

  // The customers list doesn't include orders, so a picked customer's orders
  // load from the dedicated endpoint; guests fall back to store-wide recents.
  const pickerOrders = selectedCustomer ? customerOrders : recentOrders;

  const orderOptions = useMemo(
    () => pickerOrders.map(orderOptionLabel),
    [pickerOrders]
  );

  /** Links the ticket to a customer and autofills their contact details. */
  const selectCustomer = (customer: User) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customerOptionLabel(customer));
    setShowSuggestions(false);
    setValue("name", customer.name, { shouldValidate: true });
    setValue("email", customer.email, { shouldValidate: true });
    setValue("mobile", customer.mobileNumber || "", { shouldValidate: true });
    setValue("orderReference", "");
  };

  // Zod's .trim() already normalizes the values here.
  const onSubmit = async (values: TicketFormData) => {
    try {
      await postData("contact-messages", {
        ...values,
        ...(selectedCustomer ? { userId: selectedCustomer.id } : {}),
      });
      toast.success("Ticket added.");
      reset({
        name: "",
        email: "",
        mobile: "",
        message: "",
        orderReference: "",
        source: ContactSource.PHONE,
      });
      setSelectedCustomer(null);
      setCustomerSearch("");
      setShowSuggestions(false);
      onClose();
      onAdded();
    } catch (error) {
      console.error("Error adding ticket:", error);
      toast.error("Failed to add ticket.");
    }
  };

  if (!open) return null;

  const selectedOrder = pickerOrders.find(
    (order) => order.orderNo === orderReference
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4">
      <div className="bg-white dark:bg-neutral-900 sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto max-w-4xl max-h-full sm:max-h-[90vh] overflow-y-auto">
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

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-6 space-y-4">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.values(ContactSource).map((option) => {
                        const meta = SOURCE_META[option];
                        const Icon = meta.icon;
                        const active = field.value === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => field.onChange(option)}
                            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 px-2 text-xs font-semibold capitalize whitespace-nowrap transition-colors ${active ? meta.activeColors : meta.colors}`}
                          >
                            <Icon className="size-4 shrink-0" />
                            <span>{option}</span>
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Customer account{" "}
                  <span className="text-xs text-gray-400 font-normal">
                    (optional — search to link the ticket)
                  </span>
                </label>
                <div className="relative">
                  <Input
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowSuggestions(true);
                      // Editing the search unlinks a previously picked customer.
                      if (selectedCustomer) {
                        setSelectedCustomer(null);
                        setValue("orderReference", "");
                      }
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setShowSuggestions(false)}
                    placeholder={
                      isLoadingCustomers
                        ? "Searching customers…"
                        : "Search customer by name, email or mobile"
                    }
                  />
                  {showSuggestions && customerSearch.trim() && (
                    <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border bg-card shadow-md">
                      {isLoadingCustomers ? (
                        <p className="px-3 py-2 text-sm text-muted-foreground">
                          Searching…
                        </p>
                      ) : customers.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-muted-foreground">
                          No matching customers.
                        </p>
                      ) : (
                        customers.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            // mousedown so the click lands before input's blur hides the list
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectCustomer(customer);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                          >
                            <span className="min-w-0 flex-1 truncate font-medium">
                              {customer.name}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                              {customer.email}
                              {customer.mobileNumber
                                ? ` · ${customer.mobileNumber}`
                                : ""}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {selectedCustomer ? (
                  <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <BadgeCheck className="size-3.5" />
                    Linked to {selectedCustomer.name} ({selectedCustomer.email})
                    — orders loaded below.
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Leave empty for a guest, or search and pick a customer to
                    autofill their contact details.
                  </p>
                )}
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Customer name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="customer@example.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile</FormLabel>
                    <FormControl>
                      <Input
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="+8801XXXXXXXXX"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                    const selected = pickerOrders.find(
                      (order) => orderOptionLabel(order) === label
                    );
                    setValue("orderReference", selected ? selected.orderNo : "");
                  }}
                  options={orderOptions}
                  placeholder={
                    isLoadingOrders || isLoadingCustomerOrders
                      ? "Loading orders..."
                      : "Select an order"
                  }
                  searchPlaceholder="Search order no. or customer..."
                  emptyMessage={
                    selectedCustomer
                      ? "This customer has no orders."
                      : "No matching recent orders."
                  }
                  disabled={isLoadingOrders || isLoadingCustomerOrders}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedCustomer
                    ? "Showing this customer's orders."
                    : `Showing the ${PICKER_LIMIT} most recent orders.`}
                </p>
              </div>
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <textarea
                        value={field.value}
                        onChange={field.onChange}
                        rows={4}
                        maxLength={1000}
                        placeholder="What the customer asked..."
                        className="w-full px-3 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </FormControl>
                    <p
                      className={`text-xs ${
                        field.value.trim().length > 0 &&
                        field.value.trim().length < 10
                          ? "text-red-500"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {message.length}/1000 characters — minimum 10.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="px-6 py-3 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button size="sm" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Ticket"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
