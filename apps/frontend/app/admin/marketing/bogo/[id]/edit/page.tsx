"use client";

import { BogoForm } from "@/components/admin/bogo/bogo-form";
import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { Button } from "@/components/ui/button";
import { getBogoCampaignById } from "@/lib/bogo-service";
import { BogoCampaign } from "@/utils/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function EditBogoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<BogoCampaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        const campaignData = await getBogoCampaignById(id);
        setCampaign(campaignData);
      } catch (error) {
        console.error("Error fetching BOGO campaign:", error);
        toast.error("Failed to load BOGO deal data");
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaignData();
  }, []);

  const handleSuccess = () => {
    toast.success("BOGO deal updated successfully");
    router.back();
  };

  if (isLoading) {
    return <LoadingIndicator message="Loading BOGO deal data..." />;
  }

  if (!campaign) {
    return (
      <AdminPageContainer>
        <div className="text-center">
          <h2 className="text-xl font-semibold">BOGO deal not found</h2>
          <p className="text-muted-foreground mt-2">
            The requested deal could not be found.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/marketing/bogo/bogo-list">
              Back to BOGO Deals
            </Link>
          </Button>
        </div>
      </AdminPageContainer>
    );
  }

  return (
    <AdminPageContainer>
      <BogoForm mode="edit" campaign={campaign} onSuccess={handleSuccess} />
    </AdminPageContainer>
  );
}
