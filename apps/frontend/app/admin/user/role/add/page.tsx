"use client";

import { RoleForm } from "@/components/admin/role/role-form";
import { FormPageHeader } from "@/components/admin/form-page-header";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AddRolePage() {
  const router = useRouter();

  const handleSuccess = () => {
    toast.success("Role created successfully");
    router.back();
  };

  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
        <FormPageHeader
        title="Role Information"
        description="Enter the details for the new role."
        backHref="/admin/user/role/role-list"
        backLabel="Back to Role List"
      />

      <RoleForm mode="create" onSuccess={handleSuccess} />
    </div>
  );
}
