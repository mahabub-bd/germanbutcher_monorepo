"use client";

import { SegmentBadge } from "@/components/admin/crm/segment-badge";
import { CartWishlistPanel } from "@/components/admin/customer/shared/cart-wishlist-panel";
import { CustomerActivitiesPanel } from "@/components/admin/customer/shared/customer-activities-panel";
import { CustomerMessagesPanel } from "@/components/admin/customer/shared/customer-messages-panel";
import { CustomerOrdersTable } from "@/components/admin/customer/shared/customer-orders-table";
import { CustomerReviewsPanel } from "@/components/admin/customer/shared/customer-reviews-panel";
import { DetailTabsList } from "@/components/admin/customer/shared/detail-tabs-list";
import StatsCard from "@/components/admin/dashboard/stats-card";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { ProfileStrip } from "@/components/common/profile-strip";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/utils";
import {
  deleteData,
  fetchProtectedData,
  patchData,
  postData,
} from "@/utils/api-utils";
import {
  Activity,
  ArrowLeft,
  CalendarClock,
  CalendarDays,
  History,
  Mail,
  MapPin,
  Phone,
  Plus,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Star,
  Users,
  Wallet,
} from "lucide-react";
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
  totalDiscount?: string;
  paidAmount?: string;
  shippingCost?: string | null;
  createdAt: string;
  /** Terminal timestamps backing the shared Elapsed Time chip. */
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  /** Method relations loaded by the CRM 360 endpoint for the orders table. */
  paymentMethod?: { name?: string | null } | null;
  shippingMethod?: { name?: string | null } | null;
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
    gender?: string | null;
    dateOfBirth?: string | null;
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

  // Default shipping area, surfaced next to the contact info.
  const defaultArea =
    profile.addresses?.find((address) => address.isDefault)?.area ??
    profile.addresses?.[0]?.area ??
    null;

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title={profile.name}
        description="Customer 360 — profile, orders, cart, reviews, messages and follow-ups"
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/crm/customers">
            <ArrowLeft className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Back to List</span>
          </Link>
        </Button>
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
      </PageHeader>

      <div className="mb-6 rounded-lg border bg-card p-4 space-y-4">
        <ProfileStrip
          name={profile.name}
          avatarUrl={profile.profilePhoto?.url}
          verified={profile.isVerified}
          badges={<SegmentBadge segment={rfm.segment} />}
          fields={[
            {
              icon: Mail,
              label: "Email",
              value: profile.email,
              href: `mailto:${profile.email}`,
            },
            {
              icon: Phone,
              label: "Mobile",
              value: profile.mobileNumber || "—",
              href: profile.mobileNumber
                ? `tel:${profile.mobileNumber}`
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
              value: profile.gender || "Not set",
              capitalize: true,
            },
            {
              icon: CalendarDays,
              label: "Date of birth",
              value: profile.dateOfBirth
                ? formatDateTime(profile.dateOfBirth)
                : "Not set",
            },
            {
              icon: CalendarClock,
              label: "Joined",
              value: formatDateTime(profile.createdAt),
            },
            {
              icon: History,
              label: "Last login",
              value: profile.lastLoginAt
                ? formatDateTime(profile.lastLoginAt)
                : "Never",
            },
          ]}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard
            title="Orders"
            value={rfm.orderCount}
            icon={ShoppingBag}
            description="Delivered orders"
            bgColor="blue"
          />
          <StatsCard
            title="Total Spent"
            value={rfm.totalSpent.toLocaleString()}
            icon={Wallet}
            description="All-time revenue"
            bgColor="green"
          />
          <StatsCard
            title="Avg Order"
            value={rfm.averageOrderValue.toLocaleString()}
            icon={Receipt}
            description="Per delivered order"
            bgColor="orange"
          />
          <StatsCard
            title="Last Order"
            value={rfm.lastOrderAt ? formatDateTime(rfm.lastOrderAt) : "Never"}
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
              count: recentOrders.length,
            },
            {
              value: "cart",
              label: "Cart & Wishlist",
              icon: ShoppingCart,
              count: cart?.items?.length ?? 0,
            },
            {
              value: "shipping",
              label: "Shipping",
              icon: MapPin,
              count: profile.addresses?.length ?? 0,
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
          ]}
        />

        <TabsContent value="orders" className="mt-4">
          <CustomerOrdersTable orders={recentOrders} showMethodColumns />
        </TabsContent>
        <TabsContent value="cart" className="mt-4">
          <CartWishlistPanel
            cartItems={cart?.items ?? []}
            wishlistItems={wishlist?.items ?? []}
          />
        </TabsContent>

        <TabsContent value="shipping" className="mt-4">
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
          <CustomerReviewsPanel reviews={reviews} />
        </TabsContent>

        <TabsContent value="messages" className="mt-4">
          <CustomerMessagesPanel messages={messages} />
        </TabsContent>

        <TabsContent value="activities" className="mt-4">
          <CustomerActivitiesPanel
            activities={activities}
            canEdit={can(MENU_URL, "canEdit")}
            canDelete={can(MENU_URL, "canDelete")}
            onToggleComplete={handleToggleComplete}
            onDelete={handleDeleteActivity}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
