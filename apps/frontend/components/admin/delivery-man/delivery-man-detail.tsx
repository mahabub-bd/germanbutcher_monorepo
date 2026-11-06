"use client";

import { CustomerOrdersTable } from "@/components/admin/customer/shared/customer-orders-table";
import { DetailTabsList } from "@/components/admin/customer/shared/detail-tabs-list";
import StatsCard from "@/components/admin/dashboard/stats-card";
import { PillBadge } from "@/components/common/pill-badge";
import { ProfileStrip } from "@/components/common/profile-strip";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import { fetchProtectedData } from "@/utils/api-utils";
import type { DeliveryMan } from "@/utils/types";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock,
  Package,
  Pencil,
  Phone,
  ShoppingBag,
  TrendingUp,
  Wallet
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

export function DeliveryManDetail() {
  const params = useParams();
  const router = useRouter();
  const deliveryManId = params?.id as string;

  const [deliveryMan, setDeliveryMan] = useState<DeliveryMan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDeliveryManDetail = async () => {
      setIsLoading(true);
      try {
        const response = await fetchProtectedData<DeliveryMan>(
          `delivery-man/${deliveryManId}`
        );
        setDeliveryMan(response);
      } catch (error) {
        console.error("Error fetching delivery man details:", error);
        toast.error("Failed to load delivery man details. Please try again.");
        router.push("/admin/delivery-man");
      } finally {
        setIsLoading(false);
      }
    };

    if (deliveryManId) {
      fetchDeliveryManDetail();
    }
  }, [deliveryManId, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingIndicator message="Loading delivery man details..." />
      </div>
    );
  }

  if (!deliveryMan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <div className="rounded-full bg-muted p-4">
          <Package className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-1">Delivery Man Not Found</h2>
          <p className="text-sm text-muted-foreground mb-3">
            The delivery man you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button asChild size="sm">
            <Link href="/admin/delivery-man">
              <ArrowLeft className="mr-2 h-3.5 w-3.5" />
              Back to Delivery Men
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const orders = deliveryMan.orders || [];

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title={deliveryMan.name}
        description="Delivery man details — profile, stats and assigned orders"
      >
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/delivery-man/${deliveryMan.id}/edit`}>
            <Pencil className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Edit</span>
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Back</span>
        </Button>
      </PageHeader>

      {/* Profile strip + stats */}
      <div className="mb-6 rounded-lg border bg-card p-4 space-y-4">
        <ProfileStrip
          name={deliveryMan.name}
          badges={
            deliveryMan.isActive ? (
              <PillBadge tone="emerald" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Active
              </PillBadge>
            ) : (
              <PillBadge tone="neutral" className="gap-1">
                <Clock className="h-3 w-3" />
                Inactive
              </PillBadge>
            )
          }
          fields={[
            {
              icon: Phone,
              label: "Mobile",
              value: deliveryMan.mobileNumber || "—",
              href: deliveryMan.mobileNumber
                ? `tel:${deliveryMan.mobileNumber}`
                : undefined,
            },
            {
              icon: CalendarClock,
              label: "Joined",
              value: formatDateTime(deliveryMan.createdAt),
            },
          ]}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard
            title="Total Deliveries"
            value={deliveryMan.totalDeliveries}
            icon={Package}
            description="Orders delivered"
            bgColor="blue"
          />
          <StatsCard
            title="Total Earnings"
            value={formatCurrencyEnglish(deliveryMan.totalEarnings)}
            icon={Wallet}
            description="All-time earnings"
            bgColor="green"
          />
          <StatsCard
            title="Avg. Earning"
            value={formatCurrencyEnglish(
              deliveryMan.totalDeliveries > 0
                ? deliveryMan.totalEarnings / deliveryMan.totalDeliveries
                : 0
            )}
            icon={TrendingUp}
            description="Per delivery"
            bgColor="orange"
          />
          <StatsCard
            title="Status"
            value={deliveryMan.isActive ? "Active" : "Inactive"}
            icon={deliveryMan.isActive ? CheckCircle2 : Clock}
            description="Current availability"
            bgColor={deliveryMan.isActive ? "purple" : "red"}
          />
        </div>
      </div>

      <Tabs defaultValue="orders">
        <DetailTabsList
          tabs={[
            {
              value: "orders",
              label: "Assigned Orders",
              icon: ShoppingBag,
              count: orders.length,
            },
          ]}
        />

        <TabsContent value="orders" className="mt-4">
          <CustomerOrdersTable
            orders={orders}
            showMethodColumns
            emptyMessage="No orders assigned yet."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
