import { BannerForm } from "@/components/admin/banner/banner-form";
import { FormPageHeader } from "@/components/admin/form-page-header";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function AddBannerPage() {
  return (
    <AdminPageContainer>
      <FormPageHeader
        title="Add Banner"
        description="Create a promotional banner for the storefront"
        backHref="/admin/banner/banner-list"
        backLabel="Back to Banners"
      />
      <BannerForm mode="create" />
    </AdminPageContainer>
  );
}
