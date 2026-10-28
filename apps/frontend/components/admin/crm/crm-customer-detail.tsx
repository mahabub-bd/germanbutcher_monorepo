"use client";

import { SegmentBadge } from "@/components/admin/crm/segment-badge";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/utils";
import {
  deleteData,
  fetchProtectedData,
  patchData,
  postData,
} from "@/utils/api-utils";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  Circle,
  Mail,
  MapPin,
  Phone,
  Plus,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Star,
  Trash2,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { StatusCard } from "../dashboard/status-card";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

interface OrderItem {
  id: number;
  orderNo: string;
  orderStatus: string;
  paymentStatus: string;
  totalValue: number;
  createdAt: string;
}

interface ActivityItem {
  id: number;
  type: "note" | "task" | "call" | "email";
  title: string;
  description: string | null;
  dueDate: string | null;
  status: "open" | "completed";
  completedAt: string | null;
  createdAt: string;
  createdBy?: { id: number; name: string } | null;
}

interface Customer360 {
  profile: {
    id: number;
    name: string;
    email: string;
    mobileNumber: string | null;
    isVerified: boolean;
    createdAt: string;
    lastLoginAt: string | null;
    profilePhoto: { id: number; url: string } | null;
    addresses?: Array<{
      id: number;
      address?: string;
      area?: string;
      division?: string;
      city?: string;
      type?: string;
      isDefault?: boolean;
    }>;
  };
  rfm: {
    orderCount: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderAt: string | null;
    segment: string;
  };
  recentOrders: OrderItem[];
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
  activities: ActivityItem[];
}

const ACTIVITY_TYPE_OPTIONS = [
  { value: "note", label: "Note" },
  { value: "task", label: "Task" },
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
] as const;

export function CrmCustomerDetail() {
  const params = useParams();
  const router = useRouter();
  const customerId = params?.id as string;

  const { can } = usePermissions();
  const MENU_URL = "/admin/crm/customers";

  const [customer, setCustomer] = useState<Customer360 | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [activityForm, setActivityForm] = useState({
    type: "note",
    title: "",
    description: "",
    dueDate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDataInternal = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchProtectedData<Customer360>(
        `crm/customers/${customerId}`
      );
      setCustomer(res as unknown as Customer360);
    } catch {
      toast.error("Failed to load customer.");
      router.push("/admin/crm/customers");
    } finally {
      setIsLoading(false);
    }
  }, [customerId, router]);

  useEffect(() => {
    if (customerId) {
      fetchDataInternal();
    }
  }, [customerId, fetchDataInternal]);

  // After create/complete/delete, refresh the 360 payload so the
  // activities list and task counts stay in sync.
  const refreshActivities = fetchDataInternal;

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
      refreshActivities();
    } catch {
      toast.error("Failed to add activity.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleComplete = async (activity: ActivityItem) => {
    const nextStatus = activity.status === "open" ? "completed" : "open";
    try {
      await patchData(`crm/activities/${activity.id}`, { status: nextStatus });
      refreshActivities();
    } catch {
      toast.error("Failed to update activity.");
    }
  };

  const handleDeleteActivity = async (activity: ActivityItem) => {
    try {
      await deleteData(`crm/activities/${activity.id}`);
      toast.success("Activity deleted.");
      refreshActivities();
    } catch {
      toast.error("Failed to delete activity.");
    }
  };

  if (isLoading) {
    return <LoadingIndicator message="Loading customer..." />;
  }

  if (!customer) return null;

  const { profile, rfm, recentOrders, cart, wishlist, reviews, messages, activities } =
    customer;

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title={profile.name}
        description="Customer 360 — profile, orders, cart, reviews, messages and follow-ups"
      />

      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {profile.profilePhoto?.url ? (
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border bg-muted">
                <Image
                  src={profile.profilePhoto.url}
                  alt={profile.name}
                  fill
                  className="object-contain"
                />
              </span>
            ) : (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border bg-muted text-xl font-semibold text-muted-foreground uppercase">
                {profile.name?.charAt(0) || "?"}
                </span>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{profile.name}</h2>
                <SegmentBadge segment={rfm.segment} />
              </div>
              <div className="text-sm text-muted-foreground flex flex-col sm:flex-row sm:gap-4">
                <span>{profile.email}</span>
                {profile.mobileNumber && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {profile.mobileNumber}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={!can(MENU_URL, "canCreate")}>
                <Plus className="h-4 w-4 mr-1" /> Add Activity
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
                    <SelectTrigger>
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
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatusCard
            title="Orders"
            value={rfm.orderCount}
            icon={ShoppingBag}
            color="text-blue-600 dark:text-blue-400"
            gradient="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
            className="pointer-events-none"
          />
          <StatusCard
            title="Total Spent"
            value={rfm.totalSpent.toLocaleString()}
            icon={Wallet}
            color="text-green-600 dark:text-green-400"
            gradient="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
            className="pointer-events-none"
          />
          <StatusCard
            title="Avg Order"
            value={rfm.averageOrderValue.toLocaleString()}
            icon={Receipt}
            color="text-orange-600 dark:text-orange-400"
            gradient="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20"
            className="pointer-events-none"
          />
          <StatusCard
            title="Last Order"
            value={rfm.lastOrderAt ? formatDateTime(rfm.lastOrderAt) : "Never"}
            icon={CalendarClock}
            color="text-purple-600 dark:text-purple-400"
            gradient="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
            className="pointer-events-none"
          />
        </div>
      </div>

      <Tabs defaultValue="orders">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b bg-transparent p-0">
          {(
            [
              { value: "orders", label: "Orders", icon: ShoppingBag, count: recentOrders.length },
              { value: "cart", label: "Cart & Wishlist", icon: ShoppingCart, count: cart?.items?.length ?? 0 },
              { value: "addresses", label: "Shipping", icon: MapPin, count: profile.addresses?.length ?? 0 },
              { value: "reviews", label: "Reviews", icon: Star, count: reviews.length },
              { value: "messages", label: "Messages", icon: Mail, count: messages.length },
              { value: "activities", label: "Activities", icon: Activity, count: activities.length },
            ] as const
          ).map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-none gap-1.5 rounded-none border-0 border-b-2 border-transparent bg-transparent px-3 py-2.5 h-auto shadow-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-primary dark:data-[state=active]:bg-transparent"
            >
              <tab.icon className="size-4" />
              {tab.label}
              <Badge
                variant="secondary"
                className="ml-0.5 h-5 min-w-5 rounded-full px-1.5 text-[11px] font-medium tabular-nums"
              >
                {tab.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="orders" className="mt-4">
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No orders yet.
            </p>
          ) : (
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Link
                          href={`/admin/order/${order.id}`}
                          className="font-medium hover:underline"
                        >
                          {order.orderNo}
                        </Link>
                        <span className="block text-xs text-muted-foreground">
                          {formatDateTime(order.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.orderStatus}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.paymentStatus}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {order.totalValue.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        <TabsContent value="cart" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" /> Current Cart
              </h3>
              {!cart?.items?.length ? (
                <p className="text-sm text-muted-foreground">Cart is empty.</p>
              ) : (
                <div className="space-y-2">
                  {cart.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <span className="truncate">{item.product?.name}</span>
                      <span className="text-muted-foreground ml-2">
                        {item.quantity} × {item.product?.salePrice?.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border bg-card p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <CalendarClock className="h-4 w-4" /> Wishlist
              </h3>
              {!wishlist?.items?.length ? (
                <p className="text-sm text-muted-foreground">Wishlist is empty.</p>
              ) : (
                <div className="space-y-2">
                  {wishlist.items.slice(0, 10).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <span className="truncate">{item.product?.name}</span>
                      <span className="text-muted-foreground ml-2">
                        {item.product?.salePrice?.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="addresses" className="mt-4">
          {!profile.addresses?.length ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No shipping addresses saved.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {profile.addresses.map((address) => (
                <div key={address.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {address.area || "Unnamed area"}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      {address.type && (
                        <Badge variant="outline" className="capitalize">
                          {String(address.type).replace(/_/g, " ")}
                        </Badge>
                      )}
                      {address.isDefault && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 space-y-0.5 text-sm">
                    {address.address && <p>{address.address}</p>}
                    <p className="text-muted-foreground">
                      {[...new Set([address.area, address.city, address.division])]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No reviews yet.
            </p>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </span>
                      {review.title && (
                        <span className="text-sm font-medium">{review.title}</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(review.createdAt)}
                    </span>
                  </div>
                  {review.product && (
                    <p className="text-xs text-muted-foreground mt-1">
                      On {review.product.name}
                    </p>
                  )}
                  <p className="text-sm mt-2">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="messages" className="mt-4">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No messages yet.
            </p>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div key={message.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Mail className="h-4 w-4" /> {message.email}
                    </span>
                    <Badge variant="outline" className="capitalize">
                      {message.contactStatus.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="text-sm mt-2">{message.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateTime(message.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activities" className="mt-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No activities yet. Use "Add Activity" to record a note or task.
            </p>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-lg border bg-card p-4 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="capitalize">
                        {activity.type}
                      </Badge>
                      <span
                        className={`text-sm font-medium ${
                          activity.status === "completed"
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {activity.title}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                      <span>{formatDateTime(activity.createdAt)}</span>
                      {activity.createdBy?.name && (
                        <span>by {activity.createdBy.name}</span>
                      )}
                      {activity.dueDate && activity.status === "open" && (
                        <span className="flex items-center gap-1">
                          <CalendarClock className="h-3 w-3" />
                          due {formatDateTime(activity.dueDate)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={!can(MENU_URL, "canEdit")}
                      onClick={() => handleToggleComplete(activity)}
                      aria-label={
                        activity.status === "open"
                          ? "Mark completed"
                          : "Reopen"
                      }
                    >
                      {activity.status === "open" ? (
                        <Circle className="h-4 w-4" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={!can(MENU_URL, "canDelete")}
                      onClick={() => handleDeleteActivity(activity)}
                      aria-label="Delete activity"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
