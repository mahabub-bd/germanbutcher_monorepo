'use client'

import { CouponUsageLogList } from "@/components/admin/coupon/coupon-usage-log-list";
import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { fetchProtectedData } from "@/utils/api-utils";
import { Coupon } from "@/utils/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function CouponUsageLogsPage() {
  const params = useParams();
  const code = params.code as string;

  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCouponData = async () => {
      try {
        const couponData = await fetchProtectedData<Coupon>(`coupons/${code}`);
        setCoupon(couponData);
      } catch (error) {
        console.error("Error fetching coupon:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCouponData();
  }, [code]);

  if (isLoading) {
    return <LoadingIndicator message="Loading coupon data..." />;
  }

  if (!coupon) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Coupon not found</h2>
          <p className="text-muted-foreground mt-2">
            The requested coupon could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 border rounded-sm">
      <CouponUsageLogList couponCode={code} />
    </div>
  );
}
