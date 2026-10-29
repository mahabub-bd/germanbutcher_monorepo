"use client";

import { RoleForm } from "@/components/admin/role/role-form";
import { FormPageHeader } from "@/components/admin/form-page-header";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function AddRolePage() {
  const router = useRouter();

  const handleSuccess = () => {
    toast.success("Role created successfully");
    router.back();
  };

  return (
    <AdminPageContainer>
        <FormPageHeader
        title="Role Information"
        description="Enter the details for the new role."
        backHref="/admin/user/role/role-list"
        backLabel="Back to Role List"
      />

      <RoleForm mode="create" onSuccess={handleSuccess} />
    </AdminPageContainer>
  );
}
