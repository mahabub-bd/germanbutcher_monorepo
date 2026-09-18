"use client";

import { logout } from "@/actions/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatCurrencyEnglish,
  formatDateTime,
  getStatusBadgeColor,
} from "@/lib/utils";
import type { Order, UserTypes } from "@/utils/types";
import {
  Heart,
  LayoutDashboard,
  MapPin,
  PackageCheck,
  ShoppingBag,
  Truck,
  User,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DashboardContentProps {
  user: UserTypes;
  orders: Order[];
}

export default function DashboardContent({
  user,
  orders = [],
}: DashboardContentProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      router.push("/auth");
    } catch (error) {
      toast.error("Failed to log out");
      console.error(error);
    }
  };

  const delivered = orders.filter((o) => o.orderStatus === "delivered");
  const inProgress = orders.filter((o) =>
    ["pending", "processing", "shipped"].includes(o.orderStatus)
  );
  const totalSpent = delivered.reduce((sum, o) => sum + (o.totalValue || 0), 0);

  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const stats = [
    {
      label: "Total Orders",
      value: orders.length,
      icon: <ShoppingBag className="h-4 w-4" />,
    },
    {
      label: "In Progress",
      value: inProgress.length,
      icon: <Truck className="h-4 w-4" />,
    },
    {
      label: "Delivered",
      value: delivered.length,
      icon: <PackageCheck className="h-4 w-4" />,
    },
    {
      label: "Total Spent",
      value: formatCurrencyEnglish(totalSpent),
      icon: <Wallet className="h-4 w-4" />,
    },
  ];

  const quickLinks = [
    {
      icon: <User className="h-5 w-5" />,
      label: "Profile",
      description: "Personal information",
      href: `/user/${user.id}/profile`,
    },
    {
      icon: <ShoppingBag className="h-5 w-5" />,
      label: "All Orders",
      description: "Track and manage orders",
      href: `/user/${user.id}/orders`,
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      label: "Addresses",
      description: "Shipping addresses",
      href: `/user/${user.id}/addresses`,
    },
    {
      icon: <Heart className="h-5 w-5" />,
      label: "Wishlist",
      description: "Your saved items",
      href: `/user/${user.id}/wishlist`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-primary/10 sm:flex">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back, {user?.name || "User"}!
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          Sign Out
        </Button>
      </div>

      {/* Order stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                {stat.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="truncate text-xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Your latest {recentOrders.length || ""} orders</CardDescription>
            </div>
            {orders.length > 0 && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/user/${user.id}/orders`}>View all</Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <ShoppingBag className="h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  You haven&apos;t placed any orders yet.
                </p>
                <Button size="sm" asChild>
                  <Link href="/products">Start Shopping</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/user/${user.id}/order/${order.id}`}
                    className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {order.orderNo}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="hidden text-sm font-semibold sm:inline">
                        {formatCurrencyEnglish(order.totalValue)}
                      </span>
                      <Badge
                        variant="secondary"
                        className={getStatusBadgeColor(order.orderStatus)}
                      >
                        {order.orderStatus}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Manage your account</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {quickLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {link.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{link.label}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {link.description}
                  </p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
