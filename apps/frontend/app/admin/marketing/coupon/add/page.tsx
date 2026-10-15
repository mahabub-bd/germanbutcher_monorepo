"use client";

import { CouponForm } from "@/components/admin/coupon/coupon-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AddCouponPage() {
  const router = useRouter();

  const handleSuccess = () => {
    toast.success("Coupon created successfully");
    router.push("/admin/marketing/coupon/coupon-list");
  };

  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <CouponForm mode="create" onSuccess={handleSuccess} />
    </div>
  );
}
