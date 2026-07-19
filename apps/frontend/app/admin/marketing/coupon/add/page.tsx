"use client";

import { CouponForm } from "@/components/admin/coupon/coupon-form";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AddCouponPage() {
  const router = useRouter();

  const handleSuccess = () => {
    toast.success("Coupon created successfully");
    router.back();
  };

  return (
    <div className="space-y-6 border rounded-sm">
      <div className="md:p-4 p-2">
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Coupon Information</CardTitle>
            <CardDescription>
              Enter the details for the new coupon.
            </CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/coupons">Back to Coupon List</Link>
          </Button>
        </div>
      </div>

      <CouponForm mode="create" onSuccess={handleSuccess} />
    </div>
  );
}
