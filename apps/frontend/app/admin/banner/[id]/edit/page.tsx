"use client";

import { BannerForm } from "@/components/admin/banner/banner-form";
import { FormPageHeader } from "@/components/admin/form-page-header";
import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { fetchData } from "@/utils/api-utils";
import type { Banner } from "@/utils/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function EditBannerPage() {
  const params = useParams();
  const bannerId = params.id as string;

  const [banner, setBanner] = useState<Banner | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBanner = async () => {
    try {
      const response = await fetchData<Banner>(`banners/${bannerId}`);
      setBanner(response);
    } catch (error) {
      console.error("Error fetching banner:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanner();
  }, [bannerId]);

  if (isLoading) {
    return <LoadingIndicator message="Loading Banner" />;
  }

  if (!banner) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Banner not found</p>
      </div>
    );
  }

  return (
    <AdminPageContainer>
      <FormPageHeader
        title="Edit Banner"
        description="Update this banner content and settings"
        backHref="/admin/banner/banner-list"
        backLabel="Back to Banners"
      />
      <BannerForm mode="edit" banner={banner} />
    </AdminPageContainer>
  );
}
