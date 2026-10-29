"use client";

import { CouponForm } from "@/components/admin/coupon/coupon-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function AddCouponPage() {
  const router = useRouter();

  const handleSuccess = () => {
    toast.success("Coupon created successfully");
    router.push("/admin/marketing/coupon/coupon-list");
  };

  return (
    <AdminPageContainer>
      <CouponForm mode="create" onSuccess={handleSuccess} />
    </AdminPageContainer>
  );
}
