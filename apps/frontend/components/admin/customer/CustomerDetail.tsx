"use client";

import { CartWishlistPanel } from "@/components/admin/customer/shared/cart-wishlist-panel";
import { CustomerActivitiesPanel } from "@/components/admin/customer/shared/customer-activities-panel";
import { CustomerMessagesPanel } from "@/components/admin/customer/shared/customer-messages-panel";
import { CustomerOrdersTable } from "@/components/admin/customer/shared/customer-orders-table";
import { CustomerReviewsPanel } from "@/components/admin/customer/shared/customer-reviews-panel";
import { DetailTabsList } from "@/components/admin/customer/shared/detail-tabs-list";
import StatsCard from "@/components/admin/dashboard/stats-card";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import {
  formatAction,
  MethodPill,
  StatusPill,
} from "@/components/admin/reports/user-activity/audit-visuals";
import { ProfileStrip } from "@/components/common/profile-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import {
  getEnabledAreas,
  getEnabledCities,
  getEnabledDivisions,
} from "@/lib/delivery-coverage";
import { formatDateTime } from "@/lib/utils";
import {
  deleteData,
  fetchProtectedData,
  patchData,
  postData,
} from "@/utils/api-utils";
import { CustomerData } from "@/utils/types";
import {
  Activity,
  ArrowLeft,
  CalendarClock,
  CalendarDays,
  History,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Star,
  User,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

/** 360 data only the CRM endpoint provides; fetched alongside users/:id
 *  so the customer detail page can render the same extra tabs. */
interface CrmExtras {
  cart: {
    id: number;
    updatedAt: string;
    items: Array<{
      id: number;
      quantity: number;
      product: { id: number; name: string; salePrice: number };
    }> | null;
  } | null;
  wishlist: {
    id: number;
    items: Array<{
      id: number;
      product: { id: number; name: string; salePrice: number };
    }> | null;
  } | null;
  reviews: Array<{
    id: number;
    rating: number;
    title: string | null;
    comment: string;
    createdAt: string;
    product?: { id: number; name: string } | null;
  }>;
  messages: Array<{
    id: number;
    name: string;
    email: string;
    message: string;
    contactStatus: string;
    createdAt: string;
  }>;
  activities: Array<{
    id: number;
    type: "note" | "task" | "call" | "email";
    title: string;
    description: string | null;
    dueDate: string | null;
    status: "open" | "completed";
    completedAt: string | null;
    createdAt: string;
    createdBy?: { id: number; name: string } | null;
  }>;
}

/** Audit-trail entry from the user_activity table (POST/PATCH/DELETE only). */
interface UserActivityLog {
  id: number;
  action: string;
  entityType: string;
  entityId: number | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddress: string | null;
  status: string;
  message: string | null;
  createdAt: string;
}

const ACTIVITY_TYPE_OPTIONS = [
  { value: "note", label: "Note" },
  { value: "task", label: "Task" },
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
] as const;

export function CustomerDetail() {
  const params = useParams();
  const router = useRouter();
  const customerId = params?.id as string;

  const { can } = usePermissions();
  // Activities read/write through the CRM menu permissions, same as the
  // CRM 360 page — the customer menu has no activity permissions of its own.
  const CRM_MENU_URL = "/admin/crm/customers";

  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [extras, setExtras] = useState<CrmExtras | null>(null);
  const [auditLogs, setAuditLogs] = useState<UserActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activityForm, setActivityForm] = useState({
    type: "note",
    title: "",
    description: "",
    dueDate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Address editing on the shipping tab — admins fix customer addresses
  // through the same address API the customer app uses (staff tokens skip
  // the ownership scope on the backend).
  const settings = useBusinessSettings();
  const coverage = settings?.deliveryCoverage ?? null;
  const CUSTOMER_MENU_URL = "/admin/customer/customer-list";
  const [editingAddress, setEditingAddress] = useState<{
    id: number;
    address: string;
    division: string;
    city: string;
    area: string;
    type: string;
    isDefault: boolean;
  } | null>(null);
  const [addressForm, setAddressForm] = useState({
    address: "",
    division: "",
    city: "",
    area: "",
    type: "shipping",
    isDefault: false,
  });
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const openAddressEdit = (
    addr: NonNullable<CustomerData["addresses"]>[number]
  ) => {
    setEditingAddress({
      id: addr.id,
      address: addr.address || "",
      division: addr.division || "",
      city: addr.city || "",
      area: addr.area || "",
      type: addr.type || "shipping",
      isDefault: Boolean(addr.isDefault),
    });
    setAddressForm({
      address: addr.address || "",
      division: addr.division || "",
      city: addr.city || "",
      area: addr.area || "",
      type: addr.type || "shipping",
      isDefault: Boolean(addr.isDefault),
    });
  };

  const handleSaveAddress = async () => {
    if (!editingAddress) return;
    if (!addressForm.address.trim()) {
      toast.error("Street address is required.");
      return;
    }
    setIsSavingAddress(true);
    try {
      await patchData(`addresses/${editingAddress.id}`, {
        address: addressForm.address.trim(),
        division: addressForm.division || undefined,
        city: addressForm.city || undefined,
        area: addressForm.area || undefined,
        type: addressForm.type,
        isDefault: addressForm.isDefault,
      });
      toast.success("Address updated.");
      setEditingAddress(null);
      fetchData();
    } catch (error) {
      console.error("Error updating address:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update address."
      );
    } finally {
      setIsSavingAddress(false);
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Profile, addresses and the delivered-orders history come from the
      // users endpoint; cart/wishlist/reviews/messages/activities from the
      // CRM 360 endpoint. The 360 payload failing must not lose the page —
      // only the extra tabs go empty.
      const [customerRes, extrasRes, auditRes] = await Promise.allSettled([
        // ?orders=all — the admin view shows every order, not just delivered.
        fetchProtectedData<CustomerData>(`users/${customerId}?orders=all`),
        fetchProtectedData<CrmExtras>(`crm/customers/${customerId}`),
        // System-recorded activity log (order/cart/profile changes) for this
        // user only; non-fatal if it fails — the tab just goes empty.
        fetchProtectedData<UserActivityLog[]>(
          `user-activities/${customerId}`
        ),
      ]);
      if (customerRes.status === "fulfilled") {
        setCustomer(customerRes.value);
      } else {
        throw customerRes.reason;
      }
      setExtras(
        extrasRes.status === "fulfilled" ? extrasRes.value : null,
      );
      setAuditLogs(
        auditRes.status === "fulfilled" ? auditRes.value ?? [] : [],
      );
    } catch (error) {
      console.error("Error fetching customer details:", error);
      toast.error("Failed to load customer details. Please try again.");
      router.push("/admin/customers");
    } finally {
      setIsLoading(false);
    }
  }, [customerId, router]);

  useEffect(() => {
    if (customerId) {
      fetchData();
    }
  }, [customerId, fetchData]);

  const handleAddActivity = async () => {
    if (!activityForm.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    setIsSubmitting(true);
    try {
      await postData(`crm/customers/${customerId}/activities`, {
        type: activityForm.type,
        title: activityForm.title.trim(),
        description: activityForm.description.trim() || undefined,
        dueDate: activityForm.dueDate || undefined,
      });
      toast.success("Activity added.");
      setActivityForm({ type: "note", title: "", description: "", dueDate: "" });
      setIsDialogOpen(false);
      fetchData();
    } catch {
      toast.error("Failed to add activity.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleComplete = async (activity: {
    id: number;
    status: string;
  }) => {
    const nextStatus = activity.status === "open" ? "completed" : "open";
    try {
      await patchData(`crm/activities/${activity.id}`, { status: nextStatus });
      fetchData();
    } catch {
      toast.error("Failed to update activity.");
    }
  };

  const handleDeleteActivity = async (activity: { id: number }) => {
    try {
      await deleteData(`crm/activities/${activity.id}`);
      toast.success("Activity deleted.");
      fetchData();
    } catch {
      toast.error("Failed to delete activity.");
    }
  };

  const calculateOrderStats = () => {
    if (!customer?.orders) {
      return {
        total: 0,
        totalSpent: 0,
        avgOrder: 0,
        lastOrderAt: null as string | null,
      };
    }

    const totalSpent = customer.orders.reduce((sum, order) => {
      const numericValue =
        parseFloat(order.totalValue?.toString().replace(/[^\d.]/g, "")) || 0;
      return sum + numericValue;
    }, 0);

    const lastOrderAt = customer.orders.reduce<string | null>((latest, order) => {
      if (!latest || order.createdAt > latest) return order.createdAt;
      return latest;
    }, null);

    return {
      total: customer.orders.length,
      totalSpent,
      avgOrder:
        customer.orders.length > 0 ? totalSpent / customer.orders.length : 0,
      lastOrderAt,
    };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingIndicator message="Loading customer details..." />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <div className="rounded-full bg-muted p-4">
          <User className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-1">Customer Not Found</h2>
          <p className="text-sm text-muted-foreground mb-3">
            The customer you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button asChild size="sm">
            <Link href="/admin/customers">
              <ArrowLeft className="mr-2 h-3.5 w-3.5" />
              Back to Customers
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const orderStats = calculateOrderStats();
  const rolename = customer.role?.rolename ?? "";
  // Default shipping area, surfaced next to the contact info — same as the
  // CRM 360 profile strip.
  const defaultArea =
    customer.addresses.find((address) => address.isDefault)?.area ??
    customer.addresses[0]?.area ??
    null;
  const cartItems = extras?.cart?.items ?? [];
  const wishlistItems = extras?.wishlist?.items ?? [];
  const reviews = extras?.reviews ?? [];
  const messages = extras?.messages ?? [];
  const activities = extras?.activities ?? [];

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title={customer.name}
        description="Customer details — profile, orders, cart, reviews, messages and follow-ups"
      >
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/customer/${customer.id}/edit`}>
            <Pencil className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Edit</span>
          </Link>
        </Button>
        {can(CRM_MENU_URL, "canCreate") && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" aria-label="Add Activity">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Activity</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Activity</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={activityForm.type}
                    onValueChange={(value) =>
                      setActivityForm({ ...activityForm, type: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={activityForm.title}
                    onChange={(e) =>
                      setActivityForm({ ...activityForm, title: e.target.value })
                    }
                    placeholder="Follow-up call about bulk order"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Details</label>
                  <Textarea
                    value={activityForm.description}
                    onChange={(e) =>
                      setActivityForm({
                        ...activityForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Optional details..."
                  />
                </div>
                {activityForm.type === "task" && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Due date</label>
                    <Input
                      type="date"
                      value={activityForm.dueDate}
                      onChange={(e) =>
                        setActivityForm({
                          ...activityForm,
                          dueDate: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddActivity} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Activity"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Back</span>
        </Button>
      </PageHeader>

      {/* Profile strip + stats */}
      <div className="mb-6 rounded-lg border bg-card p-4 space-y-4">
        <ProfileStrip
          name={customer.name}
          avatarUrl={customer.profilePhoto?.url}
          rolename={rolename}
          verified={customer.isVerified}
          fields={[
            {
              icon: Mail,
              label: "Email",
              value: customer.email,
              href: `mailto:${customer.email}`,
            },
            {
              icon: Phone,
              label: "Mobile",
              value: customer.mobileNumber || "—",
              href: customer.mobileNumber
                ? `tel:${customer.mobileNumber}`
                : undefined,
            },
            {
              icon: MapPin,
              label: "Delivery area",
              value: defaultArea || "—",
            },
            {
              icon: Users,
              label: "Gender",
              value: customer.gender || "Not set",
              capitalize: true,
            },
            {
              icon: CalendarDays,
              label: "Date of birth",
              value: customer.dateOfBirth
                ? formatDateTime(customer.dateOfBirth)
                : "Not set",
            },
            {
              icon: CalendarClock,
              label: "Joined",
              value: formatDateTime(customer.createdAt),
            },
            {
              icon: History,
              label: "Last login",
              value: customer.lastLoginAt
                ? formatDateTime(customer.lastLoginAt)
                : "Never",
            },
          ]}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard
            title="Orders"
            value={orderStats.total}
            icon={ShoppingBag}
            description="All orders placed"
            bgColor="blue"
          />
          <StatsCard
            title="Total Spent"
            value={orderStats.totalSpent.toLocaleString()}
            icon={Wallet}
            description="All-time revenue"
            bgColor="green"
          />
          <StatsCard
            title="Avg Order"
            value={orderStats.avgOrder.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
            icon={Receipt}
            description="Per order"
            bgColor="orange"
          />
          <StatsCard
            title="Last Order"
            value={
              orderStats.lastOrderAt
                ? formatDateTime(orderStats.lastOrderAt)
                : "Never"
            }
            icon={CalendarClock}
            description="Most recent purchase"
            bgColor="purple"
          />
        </div>
      </div>

      <Tabs defaultValue="orders">
        <DetailTabsList
          tabs={[
            {
              value: "orders",
              label: "Orders",
              icon: ShoppingBag,
              count: orderStats.total,
            },
            {
              value: "cart",
              label: "Cart & Wishlist",
              icon: ShoppingCart,
              count: cartItems.length + wishlistItems.length,
            },
            {
              value: "shipping",
              label: "Shipping",
              icon: MapPin,
              count: customer.addresses.length,
            },
            {
              value: "reviews",
              label: "Reviews",
              icon: Star,
              count: reviews.length,
            },
            {
              value: "messages",
              label: "Messages",
              icon: Mail,
              count: messages.length,
            },
            {
              value: "activities",
              label: "Activities",
              icon: Activity,
              count: activities.length,
            },
            {
              value: "audit-log",
              label: "Activity Log",
              icon: History,
              count: auditLogs.length,
            },
          ]}
        />

        <TabsContent value="orders" className="mt-4">
          <CustomerOrdersTable orders={customer.orders} showMethodColumns />
        </TabsContent>

        <TabsContent value="cart" className="mt-4">
          <CartWishlistPanel
            cartItems={cartItems}
            wishlistItems={wishlistItems}
          />
        </TabsContent>

        <TabsContent value="shipping" className="mt-4">
          {customer.addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No shipping addresses saved.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {customer.addresses.map((address) => (
                <div key={address.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {address.area || "Unnamed area"}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="capitalize text-xs">
                        {address.type}
                      </Badge>
                      {address.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                      {can(CUSTOMER_MENU_URL, "canEdit") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground"
                          aria-label={`Edit address ${address.id}`}
                          onClick={() => openAddressEdit(address)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 space-y-0.5 text-sm">
                    <p className="capitalize">{address.address}</p>
                    <p className="text-muted-foreground capitalize">
                      {[address.area, address.city, address.division]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Address edit dialog — cascading division/city/area selects fed
              by the coverage tree; street address is free text. */}
          <Dialog
            open={Boolean(editingAddress)}
            onOpenChange={(open) => !open && setEditingAddress(null)}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit address</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="address-street">Street address *</Label>
                  <Input
                    id="address-street"
                    value={addressForm.address}
                    onChange={(e) =>
                      setAddressForm((p) => ({
                        ...p,
                        address: e.target.value,
                      }))
                    }
                    placeholder="House / road details"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {(
                    [
                      {
                        key: "division",
                        label: "Division",
                        options: getEnabledDivisions(coverage),
                      },
                      {
                        key: "city",
                        label: "City",
                        options: getEnabledCities(
                          coverage,
                          addressForm.division
                        ),
                      },
                      {
                        key: "area",
                        label: "Area",
                        options: getEnabledAreas(coverage, addressForm.city),
                      },
                    ] as const
                  ).map(({ key, label, options }) => (
                    <div key={key} className="space-y-1.5">
                      <Label htmlFor={`address-${key}`}>{label}</Label>
                      <Select
                        value={addressForm[key] || undefined}
                        onValueChange={(value) => {
                          setAddressForm((p) => ({
                            ...p,
                            [key]: value,
                            // Clear the children when a parent changes.
                            ...(key === "division"
                              ? { city: "", area: "" }
                              : key === "city"
                                ? { area: "" }
                                : {}),
                          }));
                        }}
                      >
                        <SelectTrigger
                          id={`address-${key}`}
                          className="w-full"
                        >
                          <SelectValue
                            placeholder={
                              key === "division" ? "Select" : "Select…"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {options.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="address-type">Type</Label>
                    <Select
                      value={addressForm.type}
                      onValueChange={(value) =>
                        setAddressForm((p) => ({ ...p, type: value }))
                      }
                    >
                      <SelectTrigger id="address-type" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shipping">Shipping</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 self-end pb-2 text-sm">
                    <Checkbox
                      checked={addressForm.isDefault}
                      onCheckedChange={(checked) =>
                        setAddressForm((p) => ({
                          ...p,
                          isDefault: checked === true,
                        }))
                      }
                    />
                    Set as default
                  </label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditingAddress(null)}
                  disabled={isSavingAddress}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveAddress}
                  disabled={isSavingAddress || !addressForm.address.trim()}
                >
                  Save changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          <CustomerReviewsPanel reviews={reviews} />
        </TabsContent>

        <TabsContent value="messages" className="mt-4">
          <CustomerMessagesPanel messages={messages} />
        </TabsContent>

        <TabsContent value="activities" className="mt-4">
          <CustomerActivitiesPanel
            activities={activities}
            canEdit={can(CRM_MENU_URL, "canEdit")}
            canDelete={can(CRM_MENU_URL, "canDelete")}
            onToggleComplete={handleToggleComplete}
            onDelete={handleDeleteActivity}
          />
        </TabsContent>

        <TabsContent value="audit-log" className="mt-4">
          {auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No recorded activity yet. Order, cart and profile changes made by
              this customer appear here.
            </p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto rounded-lg border bg-card md:block">
                <Table className="min-w-220 report-table text-xs [&_th]:text-xs [&_td]:text-xs">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-4">Method</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="pr-4 text-right">IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => {
                      // Actions are stored as "METHOD /path" — the shared audit
                      // visuals render the method pill so both pages stay alike.
                      const { method, path } = formatAction(log.action);
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="py-2 pl-4">
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <MethodPill method={method} />
                              {log.status === "failure" && (
                                <StatusPill status={log.status} />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <span
                              className="block max-w-56 truncate font-mono text-xs text-muted-foreground"
                              title={log.action}
                            >
                              {path || log.action}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="whitespace-nowrap text-xs font-medium capitalize">
                              {log.entityType}
                              {log.entityId ? ` #${log.entityId}` : ""}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="block max-w-md truncate text-xs text-muted-foreground" title={log.message || undefined}>
                              {log.message || "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                              {formatDateTime(log.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell className="pr-4 text-right">
                            <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                              {log.ipAddress || "—"}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile list: one compact line per entry */}
              <div className="divide-y rounded-lg border bg-card md:hidden">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between gap-2 px-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <MethodPill method={formatAction(log.action).method} />
                      <span className="min-w-0 truncate text-xs font-medium capitalize">
                        {log.entityType}
                        {log.entityId ? ` #${log.entityId}` : ""}
                      </span>
                    </div>
                    <span className="shrink-0 whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
