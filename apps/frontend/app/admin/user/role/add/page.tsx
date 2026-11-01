"use client";

import { RoleForm } from "@/components/admin/role/role-form";
import { FormPageHeader } from "@/components/admin/form-page-header";
import { useRouter } from "next/navigation";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function AddRolePage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.back();
  };

  return (
    <AdminPageContainer>
      <FormPageHeader
        title="Role information"
        description="Enter the details for the new role."
        backHref="/admin/user/role/role-list"
        backLabel="Back to Role List"
      />

      <RoleForm mode="create" onSuccess={handleSuccess} />
    </AdminPageContainer>
  );
}
