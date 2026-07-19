"use client";

import { CustomerForm } from "@/components/admin/customer/customer-form";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";

import { fetchProtectedData } from "@/utils/api-utils";
import type { User } from "@/utils/types";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await fetchProtectedData<User>(`users/${userId}`);
        setUser(userData);
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("Failed to load user data");
        router.push("/admin/user/user-list");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId, router]);

  const handleSuccess = () => {
    toast.success("Customer updated successfully");
    router.push("/admin/customer/customer-list");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">User not found</h2>
          <p className="text-muted-foreground mt-2">
            The requested user could not be found.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/user/user-list">Back to Users</Link>
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
            <CardTitle>User Information</CardTitle>
            <CardDescription>Update the user details.</CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/customer/customer-list">
              Back to CustomerList
            </Link>
          </Button>
        </div>
      </div>

      <CustomerForm mode="edit" user={user} onSuccess={handleSuccess} />
    </div>
  );
}
