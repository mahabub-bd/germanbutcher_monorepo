"use client";

import { BogoForm } from "@/components/admin/bogo/bogo-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function AddBogoPage() {
  const router = useRouter();

  const handleSuccess = () => {
    toast.success("BOGO deal created successfully");
    router.push("/admin/marketing/bogo/bogo-list");
  };

  return (
    <AdminPageContainer>
      <BogoForm mode="create" onSuccess={handleSuccess} />
    </AdminPageContainer>
  );
}
