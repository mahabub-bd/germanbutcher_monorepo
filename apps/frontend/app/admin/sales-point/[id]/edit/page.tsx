"use client";

import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { SalesPointForm } from "@/components/admin/sales-point/sales-point-form";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { fetchProtectedData } from "@/utils/api-utils";
import type { SalesPoint } from "@/utils/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditSalesPointPage() {
  const params = useParams();
  const salesPointId = params.id as string;
  const [salesPoint, setSalesPoint] = useState<SalesPoint | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSalesPoint = async () => {
    try {
      const response = await fetchProtectedData<SalesPoint>(
        `sales-points/${salesPointId}`
      );
      setSalesPoint(response);
    } catch (error) {
      console.error("Error fetching sales point:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesPoint();
  }, [salesPointId]);

  if (isLoading) {
    return <LoadingIndicator message="Loading Sales Point" />;
  }

  if (!salesPoint) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Sales Point not found</p>
      </div>
    );
  }

  return (
    <div className="md:p-6 p-2 space-y-6 border rounded-sm">
      <div className="md:p-6 p-2">
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Edit Sales Point</CardTitle>
            <CardDescription>
              Update the sales point information.
            </CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/sales-point/sales-point-list">
              Back to Sales Points
            </Link>
          </Button>
        </div>
      </div>
      <SalesPointForm mode="edit" salesPoint={salesPoint} />
    </div>
  );
}
