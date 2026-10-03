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

  return <CouponForm mode="create" onSuccess={handleSuccess} />;
}
