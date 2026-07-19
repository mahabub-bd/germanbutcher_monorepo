"use client";

import { BrandForm } from "@/components/admin/brand/brand-form";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function AddBrandPage() {
  return (
    <div className="md:p-6 p:2 space-y-6 border rouunded-sm">
      <div className="md:p-6 p:2">
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Add New Brand</CardTitle>
            <CardDescription>
              Create a new brand. Fill in all the required information.
            </CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/brand/brand-list">Back to Brands</Link>
          </Button>
        </div>
      </div>
      <div>
        <BrandForm mode="create" />
      </div>
    </div>
  );
}
