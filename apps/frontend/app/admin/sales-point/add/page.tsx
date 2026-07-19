"use client";

import { SalesPointForm } from "@/components/admin/sales-point/sales-point-form";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function AddSalesPointPage() {
  return (
    <div className="md:p-6 p-2 space-y-6 border rounded-sm">
      <div className="md:p-6 p-2">
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Add New Sales Point</CardTitle>
            <CardDescription>
              Create a new sales point. Fill in all the required information.
            </CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/sales-point/sales-point-list">
              Back to Sales Points
            </Link>
          </Button>
        </div>
      </div>
      <div>
        <SalesPointForm mode="create" />
      </div>
    </div>
  );
}
