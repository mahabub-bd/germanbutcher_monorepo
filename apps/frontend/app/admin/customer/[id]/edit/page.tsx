"use client";

import { CustomerForm } from "@/components/admin/customer/customer-form";
import { FormPageHeader } from "@/components/admin/form-page-header";
import { Button } from "@/components/ui/button";

import { fetchProtectedData } from "@/utils/api-utils";
import type { User } from "@/utils/types";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.id as string;

  // Preserve the list page the user came from (e.g. ?page=554)
  const listUrl = searchParams.get("page")
    ? `/admin/customer/customer-list?page=${searchParams.get("page")}`
    : "/admin/customer/customer-list";

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await fetchProtectedData<User>(`users/${userId}`);
        setUser(userData);
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("Failed to load customer data");
        router.push(listUrl);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, router]);

  const handleSuccess = () => {
    toast.success("Customer updated successfully");
    router.push(listUrl);
  };

  if (isLoading) {
    return (
      <AdminPageContainer className="md:p-4 p-2 space-y-6 rounded-sm flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading user data...</p>
        </div>
      </AdminPageContainer>
    );
  }

  if (!user) {
    return (
      <AdminPageContainer>
        <div className="text-center">
          <h2 className="text-xl font-semibold">Customer not found</h2>
          <p className="text-muted-foreground mt-2">
            The requested customer could not be found.
          </p>
          <Button asChild className="mt-4">
            <Link href={listUrl}>Back to Customers</Link>
          </Button>
        </div>
      </AdminPageContainer>
    );
  }

  return (
    <AdminPageContainer>
      <FormPageHeader
        title="Customer information"
        backHref={listUrl}
        backLabel="Back to Customers"
      />

      <CustomerForm mode="edit" user={user} onSuccess={handleSuccess} />
    </AdminPageContainer>
  );
}
