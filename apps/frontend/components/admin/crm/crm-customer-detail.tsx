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
  fetchData,
  patchData,
  postData,
} from "@/utils/api-utils";
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  Mail,
  Phone,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
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
      city?: string;
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
      const res = await fetchData<Customer360>(`crm/customers/${customerId}`);
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
          <div className="rounded-md border px-3 py-2">
            <div className="text-lg font-semibold">{rfm.orderCount}</div>
            <div className="text-xs text-muted-foreground">Orders</div>
          </div>
          <div className="rounded-md border px-3 py-2">
            <div className="text-lg font-semibold">
              {rfm.totalSpent.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total Spent</div>
          </div>
          <div className="rounded-md border px-3 py-2">
            <div className="text-lg font-semibold">
              {rfm.averageOrderValue.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Avg Order</div>
          </div>
          <div className="rounded-md border px-3 py-2">
            <div className="text-lg font-semibold">
              {rfm.lastOrderAt ? formatDateTime(rfm.lastOrderAt) : "Never"}
            </div>
            <div className="text-xs text-muted-foreground">Last Order</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">
            Orders ({recentOrders.length})
          </TabsTrigger>
          <TabsTrigger value="cart">
            Cart & Wishlist
            {cart?.items?.length ? ` (${cart.items.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
          <TabsTrigger value="messages">Messages ({messages.length})</TabsTrigger>
          <TabsTrigger value="activities">
            Activities ({activities.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
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
        <TabsContent value="cart">
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
        <TabsContent value="reviews">
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

        <TabsContent value="messages">
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

        <TabsContent value="activities">
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
