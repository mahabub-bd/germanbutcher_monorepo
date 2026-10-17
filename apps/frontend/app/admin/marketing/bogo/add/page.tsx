"use client";

import { BogoForm } from "@/components/admin/bogo/bogo-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AddBogoPage() {
  const router = useRouter();

  const handleSuccess = () => {
    toast.success("BOGO deal created successfully");
    router.push("/admin/marketing/bogo/bogo-list");
  };

  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <BogoForm mode="create" onSuccess={handleSuccess} />
    </div>
  );
}
