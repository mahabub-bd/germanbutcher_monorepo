"use client";

import { BusinessSettingsCard } from "@/components/admin/settings/business-settings-card";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import Link from "next/link";

export default function BusinessInfoSettingsPage() {
  return (
    <div className="md:p-6 p-2 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-primaryColor dark:bg-red-950/40 dark:text-red-400">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <CardTitle>Business Info</CardTitle>
            <CardDescription>
              Logo, address, phone, email, WhatsApp and Messenger used across
              the storefront and invoices.
            </CardDescription>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/settings">Back to Settings</Link>
        </Button>
      </div>

      <BusinessSettingsCard />
    </div>
  );
}
