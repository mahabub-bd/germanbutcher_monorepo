"use client";

import { RoleForm } from "@/components/admin/role/role-form";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { fetchData } from "@/utils/api-utils";
import { Role } from "@/utils/types";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;

  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRoleData = async () => {
      try {
        const roleData = await fetchData<Role>(`roles/${roleId}`);
        setRole(roleData);
      } catch (error) {
        console.error("Error fetching role:", error);
        toast.error("Failed to load role data");
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoleData();
  }, [roleId, router]);

  const handleSuccess = () => {
    toast.success("Role updated successfully");
    router.back();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading role data...</p>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Role not found</h2>
          <p className="text-muted-foreground mt-2">
            The requested role could not be found.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/user/role/role-list">Back to Roles</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="md:p-6 p:2 space-y-6 border rouunded-sm">
      <div className="md:p-6 p:2">
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Role Information</CardTitle>
            <CardDescription>Update the role details.</CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/user/role/role-list">Back to Role List</Link>
          </Button>
        </div>
      </div>

      <RoleForm mode="edit" role={role} onSuccess={handleSuccess} />
    </div>
  );
}
