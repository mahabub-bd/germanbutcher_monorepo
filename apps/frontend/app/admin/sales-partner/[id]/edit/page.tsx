"use client";

import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { SalesPartnerForm } from "@/components/admin/sales-partner/sales-partner-form";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { fetchData } from "@/utils/api-utils";
import type { SalesPartner } from "@/utils/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditSalesPartnerPage() {
  const params = useParams();
  const salesPartnerId = params.id as string;
  const [salesPartner, setSalesPartner] = useState<SalesPartner | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSalesPartner = async () => {
    try {
      const response = await fetchData<SalesPartner>(
        `sales-partners/${salesPartnerId}`
      );
      setSalesPartner(response);
    } catch (error) {
      console.error("Error fetching sales partner:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesPartner();
  }, [salesPartnerId]);

  if (isLoading) {
    return <LoadingIndicator message="Loading Sales Partner" />;
  }

  if (!salesPartner) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Sales Partner not found</p>
      </div>
    );
  }

  return (
    <div className="md:p-6 p-2 space-y-6 border rounded-sm">
      <div className="md:p-6 p-2">
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Edit Sales Partner</CardTitle>
            <CardDescription>
              Update the sales partner information.
            </CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/sales-partner/sales-partner-list">
              Back to Sales Partners
            </Link>
          </Button>
        </div>
      </div>
      <SalesPartnerForm mode="edit" salesPartner={salesPartner} />
    </div>
  );
}
