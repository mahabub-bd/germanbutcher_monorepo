"use client";

import { ClientForm } from "@/components/admin/client/client-form";
import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { fetchData } from "@/utils/api-utils";
import type { Client } from "@/utils/types";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function EditClientPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClient = async () => {
    try {
      const response = await fetchData<Client>(`clients/${clientId}`);
      setClient(response);
    } catch (error) {
      console.error("Error fetching client:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClient();
  }, [clientId]);

  if (isLoading) {
    return <LoadingIndicator message="Loading Clients" />;
  }
  if (!client) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Client not found</p>
      </div>
    );
  }

  return (
    <AdminPageContainer>
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Edit Client</CardTitle>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/client/client-list">Back to Clients</Link>
          </Button>
        </div>

      <ClientForm mode="edit" client={client} />
    </AdminPageContainer>
  );
}
