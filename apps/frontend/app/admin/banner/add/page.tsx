"use client";

import { BannerForm } from "@/components/admin/banner/banner-form";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function AddBannerPage() {
  return (
    <div className="md:p-4 p:2 space-y-6 border rouunded-sm">
      <div className="md:p-6 p:2">
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Add New Banner</CardTitle>
            <CardDescription>
              Create a new banner. Fill in all the required information.
            </CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/banner/banner-list">Back to Banners</Link>
          </Button>
        </div>
      </div>
      <div>
        <BannerForm mode="create" />
      </div>
    </div>
  );
}
