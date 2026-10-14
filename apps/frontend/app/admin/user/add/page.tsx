"use client";

import { UserForm } from "@/components/admin/user/user-form";
import { FormPageHeader } from "@/components/admin/form-page-header";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AddUserPage() {
  const router = useRouter();

  const handleSuccess = () => {
    toast.success("User created successfully");
    router.push("/admin/user/user-list");
  };

  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
        <FormPageHeader
        title="User Information"
        description="Enter the details for the new user."
        backHref="/admin/user/user-list"
        backLabel="Back to User List"
      />

      <UserForm mode="create" onSuccess={handleSuccess} />
    </div>
  );
}
