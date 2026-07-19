"use client";

import { RoleForm } from "@/components/admin/role/role-form";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AddRolePage() {
  const router = useRouter();

  const handleSuccess = () => {
    toast.success("Role created successfully");
    router.back();
  };

  return (
    <div className="md:p-6 p:2 space-y-6 border rouunded-sm">
      <div className="md:p-6 p:2">
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Role Information</CardTitle>
            <CardDescription>
              Enter the details for the new role.
            </CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/user/role/role-list">Back to Role List</Link>
          </Button>
        </div>
      </div>

      <RoleForm mode="create" onSuccess={handleSuccess} />
    </div>
  );
}
