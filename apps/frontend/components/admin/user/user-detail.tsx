"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { PaginationComponent } from "@/components/common/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import {
  getEnabledAreas,
  getEnabledCities,
  getEnabledDivisions,
} from "@/lib/delivery-coverage";
import { formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import {
  fetchDataPagination,
  fetchProtectedData,
  patchData,
} from "@/utils/api-utils";
import {
  getOrderStatusColor,
  getPaymentStatusColor,
} from "@/utils/order-helper";
import { User } from "@/utils/types";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  History,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Receipt,
  ShoppingBag,
  User as UserIcon,
  Users,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

/** Audit-trail entry from the user_activity table (POST/PATCH/DELETE only),
 *  same payload the customer detail page renders. */
interface UserActivityLogEntry {
  id: number;
  action: string;
  entityType: string;
  entityId: number | null;
  ipAddress: string | null;
  status: string;
  message: string | null;
  createdAt: string;
}

const USER_MENU_URL = "/admin/user/user-list";

export function UserDetail() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;
  const { can } = usePermissions();

  const [user, setUser] = useState<User | null>(null);
  const [auditLogs, setAuditLogs] = useState<UserActivityLogEntry[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const AUDIT_PAGE_SIZE = 10;

  // Address editing on the shipping tab — same addresses API the customer
  // detail page uses (staff tokens skip the ownership scope on the backend).
  const settings = useBusinessSettings();
  const coverage = settings?.deliveryCoverage ?? null;
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

  const openAddressEdit = (addr: NonNullable<User["addresses"]>[number]) => {
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
        error instanceof Error ? error.message : "Failed to update address.",
      );
    } finally {
      setIsSavingAddress(false);
    }
  };

  const fetchData = useCallback(async () => {
    // Page changes refresh only the log; the very first load shows the
    // full-page spinner.
    if (!user) setIsLoading(true);
    try {
      const [userRes, auditRes] = await Promise.allSettled([
        fetchProtectedData<User>(`users/${userId}`),
        fetchDataPagination<{
          data: UserActivityLogEntry[] | null;
          total?: number;
          totalPages?: number;
        }>(
          `user-activities?page=${auditPage}&limit=${AUDIT_PAGE_SIZE}&userId=${userId}`,
        ),
      ]);
      if (userRes.status === "fulfilled") {
        setUser(userRes.value);
      } else {
        throw userRes.reason;
      }
      if (auditRes.status === "fulfilled") {
        setAuditLogs(auditRes.value.data ?? []);
        setAuditTotalPages(auditRes.value.totalPages ?? 1);
      } else {
        setAuditLogs([]);
        setAuditTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to load user details. Please try again.");
      router.push(USER_MENU_URL);
    } finally {
      setIsLoading(false);
    }
  }, [userId, router, auditPage, user]);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId, fetchData]);

  const calculateOrderStats = () => {
    if (!user?.orders) {
      return {
        total: 0,
        totalSpent: 0,
        avgOrder: 0,
        lastOrderAt: null as string | null,
      };
    }

    const totalSpent = user.orders.reduce((sum, order) => {
      const numericValue =
        parseFloat(order.totalValue?.toString().replace(/[^\d.]/g, "")) || 0;
      return sum + numericValue;
    }, 0);

    const lastOrderAt = user.orders.reduce<string | null>((latest, order) => {
      if (!latest || order.createdAt > latest) return order.createdAt;
      return latest;
    }, null);

    return {
      total: user.orders.length,
      totalSpent,
      avgOrder: user.orders.length > 0 ? totalSpent / user.orders.length : 0,
      lastOrderAt,
    };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingIndicator message="Loading user details..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <div className="rounded-full bg-muted p-4">
          <UserIcon className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-1">User Not Found</h2>
          <p className="text-sm text-muted-foreground mb-3">
            The user you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <Button asChild size="sm">
            <Link href={USER_MENU_URL}>
              <ArrowLeft className="mr-2 h-3.5 w-3.5" />
              Back to Users
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const orderStats = calculateOrderStats();
  const addresses = user.addresses ?? [];
  const orders = user.orders ?? [];
  const rolename = user.role?.rolename ?? "";

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title={user.name}
        description="User details — profile, orders and recorded activity log"
      >
        {can(USER_MENU_URL, "canEdit") && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/user/${user.id}/edit`}>
              <Pencil className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Edit</span>
            </Link>
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Back</span>
        </Button>
      </PageHeader>

      {/* Profile strip + stats */}
      <div className="mb-6 rounded-lg border bg-card p-4 space-y-4">
        <div className="flex items-center gap-3">
          {user.profilePhoto ? (
            <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border bg-muted">
              <Image
                src={user.profilePhoto.url}
                alt={user.name}
                fill
                className="object-contain"
              />
            </span>
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border bg-muted text-xl font-semibold text-muted-foreground uppercase">
              {user.name?.charAt(0) || "?"}
            </span>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold capitalize">{user.name}</h2>
              {rolename && (
                <Badge variant="secondary" className="text-xs capitalize">
                  {rolename}
                </Badge>
              )}
              {user.isVerified && (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-0.5" />
                  Verified
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:gap-4">
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" /> {user.email}
              </span>
              {user.mobileNumber && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {user.mobileNumber}
                </span>
              )}
              {user.gender && (
                <span className="flex items-center gap-1 capitalize">
                  <Users className="h-3 w-3" /> {user.gender}
                </span>
              )}
              {user.dateOfBirth && (
                <span className="flex items-center gap-1">
                  <CalendarClock className="h-3 w-3" />
                  DOB {formatDateTime(user.dateOfBirth)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <CalendarClock className="h-3 w-3" />
                Joined {formatDateTime(user.createdAt)}
              </span>
              {user.lastLoginAt && (
                <span className="flex items-center gap-1">
                  <History className="h-3 w-3" />
                  Last login {formatDateTime(user.lastLoginAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard
            title="Orders"
            value={orderStats.total}
            icon={ShoppingBag}
            description="Delivered orders"
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
        <TabsList className="scrollbar-none h-auto w-full justify-start gap-1.5 overflow-x-auto rounded-none bg-transparent p-0 sm:gap-2 md:w-fit">
          {(
            [
              {
                value: "orders",
                label: "Orders",
                icon: ShoppingBag,
                count: orders.length,
                colors:
                  "bg-blue-50 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70",
                activeColors:
                  "data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-400 dark:data-[state=active]:text-blue-950",
              },
              {
                value: "shipping",
                label: "Shipping",
                icon: MapPin,
                count: addresses.length,
                colors:
                  "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70",
                activeColors:
                  "data-[state=active]:bg-emerald-600 data-[state=active]:text-white dark:data-[state=active]:bg-emerald-400 dark:data-[state=active]:text-emerald-950",
              },
              {
                value: "audit-log",
                label: "Activity Log",
                icon: History,
                count: auditLogs.length,
                colors:
                  "bg-cyan-50 text-cyan-800 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-300 dark:hover:bg-cyan-950/70",
                activeColors:
                  "data-[state=active]:bg-cyan-600 data-[state=active]:text-white dark:data-[state=active]:bg-cyan-400 dark:data-[state=active]:text-cyan-950",
              },
            ] as const
          ).map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={`h-auto flex-none gap-1.5 rounded-lg border-0 px-2.5 py-1.5 text-xs font-semibold shadow-none transition-colors sm:px-4 sm:py-2 sm:text-sm data-[state=active]:shadow-none ${tab.colors} ${tab.activeColors}`}
            >
              <tab.icon className="size-4" />
              <span className="hidden md:inline">{tab.label}</span>
              <span className="sr-only md:hidden">{tab.label}</span>
              <span className="ml-0.5 rounded-full bg-white/40 px-1.5 text-[11px] font-medium tabular-nums dark:bg-black/20">
                {tab.count}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="orders" className="mt-4">
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No delivered orders yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-card">
              <Table className="min-w-180 report-table text-sm [&_th]:text-sm [&_td]:text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID / Date</TableHead>
                    <TableHead>Order Status</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Shipping Method</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const paidAmount = Number(order.paidAmount ?? 0);
                    const due = Number(order.totalValue) - paidAmount;
                    return (
                      <TableRow key={order.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Link
                            href={`/admin/order/${order.id}/view`}
                            className="block font-medium leading-tight hover:underline"
                          >
                            {order.orderNo}
                          </Link>
                          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                            <CalendarClock className="h-3 w-3 shrink-0" />
                            {formatDateTime(order.createdAt)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`capitalize ${getOrderStatusColor(order.orderStatus)}`}
                          >
                            {order.orderStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`capitalize ${getPaymentStatusColor(order.paymentStatus)}`}
                          >
                            {order.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">
                          {order.paymentMethod?.name ?? "—"}
                        </TableCell>
                        <TableCell className="capitalize">
                          {order.shippingMethod?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrencyEnglish(order.totalValue)}
                        </TableCell>
                        <TableCell className="text-right text-green-600 dark:text-green-400">
                          {Number(order.totalDiscount ?? 0) > 0
                            ? `- ${formatCurrencyEnglish(order.totalDiscount)}`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {due > 0 ? (
                            <span className="font-medium text-destructive">
                              {formatCurrencyEnglish(due)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Paid</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="shipping" className="mt-4">
          {addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No shipping addresses saved.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {addresses.map((address) => (
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
                      {can(USER_MENU_URL, "canEdit") && (
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
                          addressForm.division,
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
                        <SelectTrigger id={`address-${key}`} className="w-full">
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

        <TabsContent value="audit-log" className="mt-4">
          {/* Activity log — one scrollable table at every breakpoint, so
              mobile swipes through all columns instead of dropping into a
              reduced card view. */}
          {auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No recorded activity yet. Order, cart and profile changes made by
              this user appear here.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border bg-card">
              <Table className="min-w-180 report-table text-sm [&_th]:text-sm [&_td]:text-sm">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="pr-4 text-right">IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="py-2 pl-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-sm font-medium ${log.action === "POST"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                              : log.action === "DELETE"
                                ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                            }`}
                        >
                          {log.action}
                        </span>
                        {log.status === "failure" && (
                          <span className="ml-1.5 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-sm font-medium text-red-700 dark:bg-red-500/20 dark:text-red-300">
                            Failed
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium capitalize">
                          {log.entityType}
                          {log.entityId ? ` #${log.entityId}` : ""}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className="block max-w-md truncate text-sm text-muted-foreground"
                          title={log.message || undefined}
                        >
                          {log.message || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
                          {formatDateTime(log.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
                          {log.ipAddress || "—"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {auditTotalPages > 1 && (
            <div className="mt-3 flex justify-center border-t pt-3 md:justify-end">
              <PaginationComponent
                currentPage={auditPage}
                totalPages={auditTotalPages}
                baseUrl="#"
                onPageChange={(page) => setAuditPage(page)}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
