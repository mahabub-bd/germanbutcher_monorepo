import { BannerForm } from "@/components/admin/banner/banner-form";
import { FormPageHeader } from "@/components/admin/form-page-header";

export default function AddBannerPage() {
  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <FormPageHeader
        title="Add Banner"
        description="Create a promotional banner for the storefront"
        backHref="/admin/banner/banner-list"
        backLabel="Back to Banners"
      />
      <BannerForm mode="create" />
    </div>
  );
}
