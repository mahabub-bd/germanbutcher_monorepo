"use client";

import { AdminPageContainer } from "@/components/admin/admin-page-container";
import { PageHeader } from "@/components/admin/page-header";
import { BusinessSettingsCard } from "@/components/admin/settings/business-settings-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function BusinessInfoSettingsPage() {
  return (
    <AdminPageContainer>
      <PageHeader
        title="Business Info"
        description="Contact details, logos and maintenance mode used across the storefront, invoices and reports."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/settings">
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline">Back to Settings</span>
          </Link>
        </Button>
      </PageHeader>

      <BusinessSettingsCard />
    </AdminPageContainer>
  );
}
