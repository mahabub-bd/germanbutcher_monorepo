"use client";

import { UserForm } from "@/components/admin/user/user-form";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import Link from "next/link";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AddUserPage() {
  const router = useRouter();

  const handleSuccess = () => {
    toast.success("User created successfully");
    router.push("/admin/user/user-list");
  };

  return (
    <div className="md:p-6 p:2 space-y-6 border rouunded-sm">
      <div className="md:p-6 p:2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>User Information</CardTitle>
            <CardDescription>
              Enter the details for the new user.
            </CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/user/user-list">Back to User List</Link>
          </Button>
        </div>
      </div>

      <UserForm mode="create" onSuccess={handleSuccess} />
    </div>
  );
}
